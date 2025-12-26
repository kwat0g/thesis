import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { BOMHeader, BOMLine } from '@/lib/types/production';

export interface BOMHeaderRow extends RowDataPacket {
  id: number;
  item_id: number;
  version: number;
  effective_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface BOMLineRow extends RowDataPacket {
  id: number;
  bom_header_id: number;
  component_item_id: number;
  quantity_per_unit: number;
  scrap_percentage: number;
  line_number: number;
  created_at: Date;
  updated_at: Date;
}

const mapRowToBOMHeader = (row: BOMHeaderRow): BOMHeader => ({
  id: row.id,
  itemId: row.item_id,
  version: row.version,
  effectiveDate: row.effective_date,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

const mapRowToBOMLine = (row: BOMLineRow): BOMLine => ({
  id: row.id,
  bomHeaderId: row.bom_header_id,
  componentItemId: row.component_item_id,
  quantityPerUnit: row.quantity_per_unit,
  scrapPercentage: row.scrap_percentage,
  lineNumber: row.line_number,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findBOMHeaderById = async (id: number): Promise<BOMHeader | null> => {
  const row = await queryOne<BOMHeaderRow>(
    'SELECT * FROM bom_headers WHERE id = ?',
    [id]
  );
  return row ? mapRowToBOMHeader(row) : null;
};

export const findActiveBOMByItem = async (itemId: number): Promise<BOMHeader | null> => {
  const row = await queryOne<BOMHeaderRow>(
    'SELECT * FROM bom_headers WHERE item_id = ? AND is_active = TRUE ORDER BY version DESC LIMIT 1',
    [itemId]
  );
  return row ? mapRowToBOMHeader(row) : null;
};

export const findBOMLinesByHeader = async (bomHeaderId: number): Promise<BOMLine[]> => {
  const rows = await query<BOMLineRow[]>(
    'SELECT * FROM bom_lines WHERE bom_header_id = ? ORDER BY line_number',
    [bomHeaderId]
  );
  return rows.map(mapRowToBOMLine);
};

export const findBOMWithLines = async (itemId: number): Promise<{ header: BOMHeader; lines: BOMLine[] } | null> => {
  const header = await findActiveBOMByItem(itemId);
  if (!header) return null;

  const lines = await findBOMLinesByHeader(header.id);
  return { header, lines };
};

export const createBOMHeader = async (data: {
  itemId: number;
  version?: number;
  effectiveDate: Date;
  isActive?: boolean;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO bom_headers (item_id, version, effective_date, is_active, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.itemId,
      data.version || 1,
      data.effectiveDate,
      data.isActive !== undefined ? data.isActive : true,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const createBOMLine = async (data: {
  bomHeaderId: number;
  componentItemId: number;
  quantityPerUnit: number;
  scrapPercentage?: number;
  lineNumber: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO bom_lines (bom_header_id, component_item_id, quantity_per_unit, scrap_percentage, line_number)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.bomHeaderId,
      data.componentItemId,
      data.quantityPerUnit,
      data.scrapPercentage || 0,
      data.lineNumber,
    ]
  );
  return result.insertId;
};

export const updateBOMHeader = async (
  id: number,
  data: {
    effectiveDate?: Date;
    isActive?: boolean;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.effectiveDate !== undefined) {
    fields.push('effective_date = ?');
    values.push(data.effectiveDate);
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(data.isActive);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE bom_headers SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteBOMHeader = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM bom_headers WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteBOMLine = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM bom_lines WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
