import { getConnection } from '../../database/connection';
import { AccountingDashboard } from '../../types/dashboard';

export const getAccountingDashboard = async (): Promise<AccountingDashboard> => {
  const connection = await getConnection();

  const [outstandingAP] = await connection.query<any[]>(
    `SELECT 
      SUM(balance) as total_outstanding,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
    FROM ap_invoices
    WHERE status IN ('approved', 'partially_paid', 'overdue')`
  );

  const [overdueAP] = await connection.query<any[]>(
    `SELECT SUM(balance) as total_overdue
    FROM ap_invoices
    WHERE due_date < CURDATE()
    AND status IN ('approved', 'partially_paid', 'overdue')`
  );

  const [statusCounts] = await connection.query<any[]>(
    `SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'partially_paid' THEN 1 ELSE 0 END) as partially_paid,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
    FROM ap_invoices`
  );

  const [agingSummary] = await connection.query<any[]>(
    `SELECT 
      SUM(CASE WHEN due_date >= CURDATE() THEN balance ELSE 0 END) as current,
      SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 1 AND 30 THEN balance ELSE 0 END) as days30,
      SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN balance ELSE 0 END) as days60,
      SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 60 THEN balance ELSE 0 END) as days90Plus
    FROM ap_invoices
    WHERE status IN ('approved', 'partially_paid', 'overdue')`
  );

  const outstanding = outstandingAP[0];
  const overdue = overdueAP[0];
  const status = statusCounts[0];
  const aging = agingSummary[0];

  return {
    totalOutstandingAP: Number(outstanding.total_outstanding || 0),
    totalOverdueAP: Number(overdue.total_overdue || 0),
    overdueInvoiceCount: outstanding.overdue_count || 0,
    apAgingSummary: {
      current: Number(aging.current || 0),
      days30: Number(aging.days30 || 0),
      days60: Number(aging.days60 || 0),
      days90Plus: Number(aging.days90Plus || 0),
    },
    invoicesByStatus: {
      pending: status.pending || 0,
      approved: status.approved || 0,
      partially_paid: status.partially_paid || 0,
      paid: status.paid || 0,
      overdue: status.overdue || 0,
    },
  };
};
