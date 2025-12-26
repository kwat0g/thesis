import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, execute } from '@/lib/database/query';
import { AuditLog } from '@/lib/types/auth';

export interface AuditLogRow extends RowDataPacket {
  id: number;
  user_id?: number;
  action: string;
  module: string;
  record_type: string;
  record_id?: number;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

const mapRowToAuditLog = (row: AuditLogRow): AuditLog => ({
  id: row.id,
  userId: row.user_id,
  action: row.action,
  module: row.module,
  recordType: row.record_type,
  recordId: row.record_id,
  oldValues: row.old_values ? JSON.parse(row.old_values) : undefined,
  newValues: row.new_values ? JSON.parse(row.new_values) : undefined,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  createdAt: row.created_at,
});

export const create = async (data: {
  userId?: number;
  action: string;
  module: string;
  recordType: string;
  recordId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO audit_logs 
     (user_id, action, module, record_type, record_id, old_values, new_values, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.action,
      data.module,
      data.recordType,
      data.recordId,
      data.oldValues ? JSON.stringify(data.oldValues) : null,
      data.newValues ? JSON.stringify(data.newValues) : null,
      data.ipAddress,
      data.userAgent,
    ]
  );
  return result.insertId;
};

export const findByModule = async (
  module: string,
  limit: number = 100
): Promise<AuditLog[]> => {
  const rows = await query<AuditLogRow[]>(
    'SELECT * FROM audit_logs WHERE module = ? ORDER BY created_at DESC LIMIT ?',
    [module, limit]
  );
  return rows.map(mapRowToAuditLog);
};

export const findByUser = async (
  userId: number,
  limit: number = 100
): Promise<AuditLog[]> => {
  const rows = await query<AuditLogRow[]>(
    'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return rows.map(mapRowToAuditLog);
};

export const findByRecord = async (
  recordType: string,
  recordId: number
): Promise<AuditLog[]> => {
  const rows = await query<AuditLogRow[]>(
    `SELECT * FROM audit_logs 
     WHERE record_type = ? AND record_id = ? 
     ORDER BY created_at DESC`,
    [recordType, recordId]
  );
  return rows.map(mapRowToAuditLog);
};

export const findRecent = async (limit: number = 100): Promise<AuditLog[]> => {
  const rows = await query<AuditLogRow[]>(
    'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapRowToAuditLog);
};
