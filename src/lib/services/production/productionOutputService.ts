import * as productionOutputRepository from '@/lib/repositories/production/productionOutputRepository';
import * as workOrderRepository from '@/lib/repositories/production/workOrderRepository';
import * as productionOrderRepository from '@/lib/repositories/production/productionOrderRepository';
import * as inventoryBalanceRepository from '@/lib/repositories/inventory/inventoryBalanceRepository';
import * as inventoryTransactionRepository from '@/lib/repositories/inventory/inventoryTransactionRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { withTransaction } from '@/lib/database/transaction';
import { ProductionOutput } from '@/lib/types/production';

export const getOutputById = async (id: number): Promise<ProductionOutput | null> => {
  return await productionOutputRepository.findById(id);
};

export const getOutputsByWorkOrder = async (workOrderId: number): Promise<ProductionOutput[]> => {
  return await productionOutputRepository.findByWorkOrder(workOrderId);
};

export const getAllOutputs = async (filters?: {
  workOrderId?: number;
  operatorId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<ProductionOutput[]> => {
  return await productionOutputRepository.findAll(filters);
};

export const recordProductionOutput = async (
  data: {
    workOrderId: number;
    operatorId: number;
    outputDate: Date;
    quantityGood: number;
    quantityScrap: number;
    quantityRework: number;
    warehouseId: number;
    shiftId?: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  return await withTransaction(async (connection) => {
    const workOrder = await workOrderRepository.findById(data.workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'in_progress') {
      throw new Error('Can only record output for in-progress work orders');
    }

    if (data.quantityGood < 0 || data.quantityScrap < 0 || data.quantityRework < 0) {
      throw new Error('Quantities cannot be negative');
    }

    const totalOutput = data.quantityGood + data.quantityScrap + data.quantityRework;
    if (totalOutput <= 0) {
      throw new Error('Total output must be greater than 0');
    }

    const currentTotal = workOrder.quantityProduced + workOrder.quantityScrap + workOrder.quantityRework;
    const newTotal = currentTotal + totalOutput;

    if (newTotal > workOrder.quantityPlanned) {
      throw new Error(`Total output (${newTotal}) exceeds planned quantity (${workOrder.quantityPlanned})`);
    }

    const outputId = await productionOutputRepository.create({
      workOrderId: data.workOrderId,
      operatorId: data.operatorId,
      outputDate: data.outputDate,
      quantityGood: data.quantityGood,
      quantityScrap: data.quantityScrap,
      quantityRework: data.quantityRework,
      shiftId: data.shiftId,
      notes: data.notes,
      createdBy,
    });

    await workOrderRepository.update(data.workOrderId, {
      quantityProduced: workOrder.quantityProduced + data.quantityGood,
      quantityScrap: workOrder.quantityScrap + data.quantityScrap,
      quantityRework: workOrder.quantityRework + data.quantityRework,
    });

    const productionOrder = await productionOrderRepository.findById(workOrder.productionOrderId);
    if (productionOrder) {
      await productionOrderRepository.updateQuantityProduced(
        workOrder.productionOrderId,
        productionOrder.quantityProduced + data.quantityGood
      );
    }

    if (data.quantityGood > 0) {
      await inventoryBalanceRepository.createOrUpdate({
        itemId: workOrder.itemId,
        warehouseId: data.warehouseId,
      });

      await inventoryBalanceRepository.adjustQuantity(
        workOrder.itemId,
        data.warehouseId,
        'quantityInspection',
        data.quantityGood
      );

      await inventoryTransactionRepository.create({
        transactionDate: data.outputDate,
        transactionType: 'receipt',
        itemId: workOrder.itemId,
        warehouseId: data.warehouseId,
        quantity: data.quantityGood,
        statusTo: 'under_inspection',
        referenceType: 'production_output',
        referenceId: outputId,
        notes: `Production output from WO ${workOrder.woNumber}`,
        createdBy,
      });
    }

    await auditLogRepository.create({
      userId: createdBy,
      action: 'RECORD_PRODUCTION_OUTPUT',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'production_output',
      recordId: outputId,
      newValues: {
        workOrderId: data.workOrderId,
        quantityGood: data.quantityGood,
        quantityScrap: data.quantityScrap,
        quantityRework: data.quantityRework,
      },
    });

    return outputId;
  });
};
