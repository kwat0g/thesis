import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Supplier } from '@/lib/types/master-data';

export interface SupplierRow extends RowDataPacket {
  id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToSupplier = (row: SupplierRow): Supplier => ({
  id: row.id,
  supplierCode: row.supplier_code,
  supplierName: row.supplier_name,
  contactPerson: row.contact_person,
  email: row.email,
  phone: row.phone,
  address: row.address,
  paymentTerms: row.payment_terms,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<Supplier | null> => {
  const row = await queryOne<SupplierRow>('SELECT * FROM suppliers WHERE id = ?', [id]);
  return row ? mapRowToSupplier(row) : null;
};

export const findByCode = async (supplierCode: string): Promise<Supplier | null> => {
  const row = await queryOne<SupplierRow>('SELECT * FROM suppliers WHERE supplier_code = ?', [supplierCode]);
  return row ? mapRowToSupplier(row) : null;
};

export const findAll = async (isActive?: boolean): Promise<Supplier[]> => {
  let sql = 'SELECT * FROM suppliers';
  const params: any[] = [];
  if (isActive !== undefined) {
    sql += ' WHERE is_active = ?';
    params.push(isActive);
  }
  sql += ' ORDER BY supplier_name';
  const rows = await query<SupplierRow[]>(sql, params);
  return rows.map(mapRowToSupplier);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  isActive?: boolean
): Promise<{ data: Supplier[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  let whereClause = '';
  const params: any[] = [];
  if (isActive !== undefined) {
    whereClause = ' WHERE is_active = ?';
    params.push(isActive);
  }
  const countResult = await queryOne<RowDataPacket>(`SELECT COUNT(*) as total FROM suppliers${whereClause}`, params);
  const total = countResult?.total || 0;
  const rows = await query<SupplierRow[]>(
    `SELECT * FROM suppliers${whereClause} ORDER BY supplier_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { data: rows.map(mapRowToSupplier), total };
};

export const create = async (data: {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO suppliers (supplier_code, supplier_name, contact_person, email, phone, address, payment_terms, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.supplierCode, data.supplierName, data.contactPerson, data.email, data.phone, data.address, data.paymentTerms, data.createdBy]
  );
  return result.insertId;
};

export const update = async (id: number, data: {
  supplierName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  isActive?: boolean;
  updatedBy?: number;
}): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.supplierName !== undefined) { fields.push('supplier_name = ?'); values.push(data.supplierName); }
  if (data.contactPerson !== undefined) { fields.push('contact_person = ?'); values.push(data.contactPerson); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
  if (data.paymentTerms !== undefined) { fields.push('payment_terms = ?'); values.push(data.paymentTerms); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive); }
  if (data.updatedBy !== undefined) { fields.push('updated_by = ?'); values.push(data.updatedBy); }
  if (fields.length === 0) return false;
  values.push(id);
  const result = await execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

export const deleteSupplier = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM suppliers WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: false, updatedBy });
};

export const activate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: true, updatedBy });
};
