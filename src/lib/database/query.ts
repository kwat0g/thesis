import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';
import getPool from './connection';

export async function query<T extends RowDataPacket[] | RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const pool = getPool();
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}
