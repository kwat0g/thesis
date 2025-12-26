import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { ProductionOutput } from '@/lib/types/production';

export interface ProductionOutputRow extends RowDataPacket {
  id: number;
  work_order_id: number;
  operator_id: number;
  output_date: Date;
  quantity_good: number;
  quantity_scrap: number;
  quantity_rework: number;
  shift_id?: number;
  notes?: string;
  created_at: Date;
  created_by?: number;
}

const mapRowToOutput = (row: ProductionOutputRow): ProductionOutput => ({
  id: row.id,
  workOrderId: row.work_order_id,
  operatorId: row.operator_id,
  outputDate: row.output_date,
  quantityGood: row.quantity_good,
  quantityScrap: row.quantity_scrap,
  quantityRework: row.quantity_rework,
  shiftId: row.shift_id,
  notes: row.notes,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

export const findById = async (id: number): Promise<ProductionOutput | null> => {
  const row = await queryOne<ProductionOutputRow>(
    'SELECT * FROM production_output WHERE id = ?',
    [id]
  );
  return row ? mapRowToOutput(row) : null;
};

export const findByWorkOrder = async (workOrderId: number): Promise<ProductionOutput[]> => {
  const rows = await query<ProductionOutputRow[]>(
    'SELECT * FROM production_output WHERE work_order_id = ? ORDER BY output_date DESC',
    [workOrderId]
  );
  return rows.map(mapRowToOutput);
};

export const findAll = async (filters?: {
  workOrderId?: number;
  operatorId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<ProductionOutput[]> => {
  let sql = 'SELECT * FROM production_output WHERE 1=1';
  const params: any[] = [];

  if (filters?.workOrderId) {
    sql += ' AND work_order_id = ?';
    params.push(filters.workOrderId);
  }

  if (filters?.operatorId) {
    sql += ' AND operator_id = ?';
    params.push(filters.operatorId);
  }

  if (filters?.fromDate) {
    sql += ' AND output_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND output_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY output_date DESC, created_at DESC';

  const rows = await query<ProductionOutputRow[]>(sql, params);
  return rows.map(mapRowToOutput);
};

export const create = async (data: {
  workOrderId: number;
  operatorId: number;
  outputDate: Date;
  quantityGood: number;
  quantityScrap: number;
  quantityRework: number;
  shiftId?: number;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO production_output 
     (work_order_id, operator_id, output_date, quantity_good, quantity_scrap, quantity_rework, shift_id, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.workOrderId,
      data.operatorId,
      data.outputDate,
      data.quantityGood,
      data.quantityScrap,
      data.quantityRework,
      data.shiftId,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const deleteOutput = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM production_output WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
