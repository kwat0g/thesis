import * as mrpRequirementRepository from '@/lib/repositories/mrp/mrpRequirementRepository';
import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { execute, query } from '@/lib/database/query';
import { RowDataPacket } from 'mysql2/promise';

interface PRGenerationResult {
  prId: number;
  prNumber: string;
  itemCount: number;
  totalQuantity: number;
  requirementIds: number[];
}

const generatePRNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `PR-MRP-${year}${month}${day}-${time}`;
};

export const generatePRsFromMRP = async (
  mrpRunId: number,
  createdBy?: number
): Promise<PRGenerationResult[]> => {
  const shortages = await mrpRequirementRepository.findShortagesByMRPRun(mrpRunId);

  if (shortages.length === 0) {
    throw new Error('No shortages found in MRP run');
  }

  const prResults: PRGenerationResult[] = [];

  const itemGroups = new Map<number, typeof shortages>();
  for (const shortage of shortages) {
    if (shortage.status === 'pr_created') {
      continue;
    }

    if (!itemGroups.has(shortage.itemId)) {
      itemGroups.set(shortage.itemId, []);
    }
    itemGroups.get(shortage.itemId)!.push(shortage);
  }

  for (const [itemId, requirements] of itemGroups.entries()) {
    const item = await itemRepository.findById(itemId);
    if (!item) continue;

    const totalShortage = requirements.reduce((sum, req) => sum + req.shortageQuantity, 0);
    const earliestDate = requirements.reduce((earliest, req) => 
      req.requiredDate < earliest ? req.requiredDate : earliest, 
      requirements[0].requiredDate
    );

    const prNumber = generatePRNumber();
    
    const prResult = await execute(
      `INSERT INTO purchase_requests 
       (pr_number, request_date, required_date, requestor_id, justification, status, approval_status, created_by)
       VALUES (?, NOW(), ?, ?, ?, 'draft', 'pending', ?)`,
      [
        prNumber,
        earliestDate,
        createdBy || 1,
        `Auto-generated from MRP Run for ${item.itemName}`,
        createdBy,
      ]
    );

    const prId = prResult.insertId;

    await execute(
      `INSERT INTO purchase_request_lines 
       (pr_id, line_number, item_id, quantity, notes)
       VALUES (?, 1, ?, ?, ?)`,
      [
        prId,
        itemId,
        totalShortage,
        `MRP shortage: ${totalShortage} ${item.itemCode}`,
      ]
    );

    const requirementIds: number[] = [];
    for (const req of requirements) {
      await mrpRequirementRepository.update(req.id, {
        status: 'pr_created',
        prId,
      });
      requirementIds.push(req.id);
    }

    prResults.push({
      prId,
      prNumber,
      itemCount: 1,
      totalQuantity: totalShortage,
      requirementIds,
    });

    await auditLogRepository.create({
      userId: createdBy,
      action: 'AUTO_GENERATE_PR',
      module: 'MRP',
      recordType: 'purchase_request',
      recordId: prId,
      newValues: {
        prNumber,
        itemId,
        quantity: totalShortage,
        mrpRunId,
        source: 'MRP',
      },
    });
  }

  await auditLogRepository.create({
    userId: createdBy,
    action: 'GENERATE_PRS_FROM_MRP',
    module: 'MRP',
    recordType: 'mrp_run',
    recordId: mrpRunId,
    newValues: {
      prsGenerated: prResults.length,
      totalItems: itemGroups.size,
    },
  });

  return prResults;
};

export const getPRsByMRPRun = async (mrpRunId: number) => {
  const requirements = await mrpRequirementRepository.findByMRPRun(mrpRunId);
  
  const prIds = [...new Set(requirements.filter(r => r.prId).map(r => r.prId!))];
  
  if (prIds.length === 0) {
    return [];
  }

  const placeholders = prIds.map(() => '?').join(',');
  const prs = await query<RowDataPacket[]>(
    `SELECT pr.*, 
            (SELECT COUNT(*) FROM purchase_request_lines WHERE pr_id = pr.id) as line_count
     FROM purchase_requests pr
     WHERE pr.id IN (${placeholders})
     ORDER BY pr.created_at DESC`,
    prIds
  );

  return prs;
};
