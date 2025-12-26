import * as mrpRunRepository from '@/lib/repositories/mrp/mrpRunRepository';
import * as mrpRequirementRepository from '@/lib/repositories/mrp/mrpRequirementRepository';
import * as productionOrderRepository from '@/lib/repositories/production/productionOrderRepository';
import * as bomRepository from '@/lib/repositories/production/bomRepository';
import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { PaginatedResponse } from '@/lib/types/common';

interface MaterialRequirement {
  itemId: number;
  itemCode: string;
  itemName: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  requiredDate: Date;
  productionOrderId: number;
}

export const getMRPRunById = async (id: number) => {
  return await mrpRunRepository.findById(id);
};

export const getAllMRPRuns = async (filters?: {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}) => {
  return await mrpRunRepository.findAll(filters);
};

export const getMRPRunsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<any>> => {
  const { data, total } = await mrpRunRepository.findPaginated(page, pageSize, filters);
  
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

export const getMRPRequirements = async (mrpRunId: number) => {
  return await mrpRequirementRepository.findByMRPRun(mrpRunId);
};

export const getMRPShortages = async (mrpRunId: number) => {
  return await mrpRequirementRepository.findShortagesByMRPRun(mrpRunId);
};

const generateMRPRunNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `MRP-${year}${month}${day}-${time}`;
};

const explodeBOM = async (
  itemId: number,
  quantity: number,
  level: number = 0
): Promise<Map<number, number>> => {
  const requirements = new Map<number, number>();

  const bomData = await bomRepository.findBOMWithLines(itemId);
  
  if (!bomData || bomData.lines.length === 0) {
    return requirements;
  }

  for (const line of bomData.lines) {
    const scrapFactor = 1 + (line.scrapPercentage / 100);
    const requiredQty = quantity * line.quantityPerUnit * scrapFactor;

    const existing = requirements.get(line.componentItemId) || 0;
    requirements.set(line.componentItemId, existing + requiredQty);

    const subBOM = await explodeBOM(line.componentItemId, requiredQty, level + 1);
    for (const [subItemId, subQty] of subBOM.entries()) {
      const existingSub = requirements.get(subItemId) || 0;
      requirements.set(subItemId, existingSub + subQty);
    }
  }

  return requirements;
};

export const executeMRP = async (
  planningHorizonDays: number = 30,
  createdBy?: number
): Promise<number> => {
  const runNumber = generateMRPRunNumber();
  const runDate = new Date();

  const mrpRunId = await mrpRunRepository.create({
    runNumber,
    runDate,
    planningHorizonDays,
    status: 'running',
    createdBy,
  });

  try {
    const horizonDate = new Date();
    horizonDate.setDate(horizonDate.getDate() + planningHorizonDays);

    const releasedOrders = await productionOrderRepository.findAll({
      status: 'released',
      toDate: horizonDate,
    });

    if (releasedOrders.length === 0) {
      await mrpRunRepository.update(mrpRunId, {
        status: 'completed',
        totalRequirements: 0,
        totalShortages: 0,
        notes: 'No released production orders found in planning horizon',
      });

      await auditLogRepository.create({
        userId: createdBy,
        action: 'EXECUTE_MRP',
        module: 'MRP',
        recordType: 'mrp_run',
        recordId: mrpRunId,
        newValues: {
          runNumber,
          status: 'completed',
          totalRequirements: 0,
          totalShortages: 0,
        },
      });

      return mrpRunId;
    }

    const materialRequirements = new Map<number, MaterialRequirement[]>();

    for (const order of releasedOrders) {
      const bomRequirements = await explodeBOM(order.itemId, order.quantityOrdered - order.quantityProduced);

      for (const [componentItemId, requiredQty] of bomRequirements.entries()) {
        if (!materialRequirements.has(componentItemId)) {
          materialRequirements.set(componentItemId, []);
        }

        const item = await itemRepository.findById(componentItemId);
        if (!item) continue;

        materialRequirements.get(componentItemId)!.push({
          itemId: componentItemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          requiredQuantity: requiredQty,
          availableQuantity: 0,
          shortageQuantity: requiredQty,
          requiredDate: order.requiredDate,
          productionOrderId: order.id,
        });
      }
    }

    let totalRequirements = 0;
    let totalShortages = 0;

    for (const [itemId, requirements] of materialRequirements.entries()) {
      for (const req of requirements) {
        await mrpRequirementRepository.create({
          mrpRunId,
          productionOrderId: req.productionOrderId,
          itemId: req.itemId,
          requiredQuantity: req.requiredQuantity,
          availableQuantity: req.availableQuantity,
          shortageQuantity: req.shortageQuantity,
          requiredDate: req.requiredDate,
          status: req.shortageQuantity > 0 ? 'shortage' : 'sufficient',
        });

        totalRequirements++;
        if (req.shortageQuantity > 0) {
          totalShortages++;
        }
      }
    }

    await mrpRunRepository.update(mrpRunId, {
      status: 'completed',
      totalRequirements,
      totalShortages,
    });

    await auditLogRepository.create({
      userId: createdBy,
      action: 'EXECUTE_MRP',
      module: 'MRP',
      recordType: 'mrp_run',
      recordId: mrpRunId,
      newValues: {
        runNumber,
        status: 'completed',
        totalRequirements,
        totalShortages,
        planningHorizonDays,
      },
    });

    return mrpRunId;
  } catch (error) {
    await mrpRunRepository.update(mrpRunId, {
      status: 'failed',
      notes: error instanceof Error ? error.message : 'Unknown error',
    });

    await auditLogRepository.create({
      userId: createdBy,
      action: 'EXECUTE_MRP_FAILED',
      module: 'MRP',
      recordType: 'mrp_run',
      recordId: mrpRunId,
      newValues: {
        runNumber,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
};

export const deleteMRPRun = async (id: number, deletedBy?: number): Promise<boolean> => {
  const existingRun = await mrpRunRepository.findById(id);
  if (!existingRun) {
    throw new Error('MRP run not found');
  }

  if (existingRun.status === 'running') {
    throw new Error('Cannot delete running MRP');
  }

  await mrpRequirementRepository.deleteByMRPRun(id);

  await auditLogRepository.create({
    userId: deletedBy,
    action: 'DELETE',
    module: 'MRP',
    recordType: 'mrp_run',
    recordId: id,
    oldValues: {
      runNumber: existingRun.runNumber,
      status: existingRun.status,
      totalRequirements: existingRun.totalRequirements,
      totalShortages: existingRun.totalShortages,
    },
  });

  return true;
};
