import { getConnection } from '../../database/connection';
import { PurchasingDashboard } from '../../types/dashboard';

export const getPurchasingDashboard = async (): Promise<PurchasingDashboard> => {
  const connection = await getConnection();

  const [prCounts] = await connection.query<any[]>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'converted_to_po' THEN 1 ELSE 0 END) as converted_to_po,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM purchase_requests`
  );

  const [poCounts] = await connection.query<any[]>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'partially_received' THEN 1 ELSE 0 END) as partially_received,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM purchase_orders`
  );

  const [openPRs] = await connection.query<any[]>(
    `SELECT COUNT(*) as open_count
    FROM purchase_requests
    WHERE status IN ('draft', 'pending_approval', 'approved')`
  );

  const [openPOs] = await connection.query<any[]>(
    `SELECT COUNT(*) as open_count
    FROM purchase_orders
    WHERE status IN ('draft', 'pending_approval', 'approved', 'sent', 'partially_received')`
  );

  const prStats = prCounts[0];
  const poStats = poCounts[0];

  return {
    openPRs: openPRs[0].open_count || 0,
    openPOs: openPOs[0].open_count || 0,
    pendingPRApprovals: prStats.pending_approval || 0,
    pendingPOApprovals: poStats.pending_approval || 0,
    prsByStatus: {
      draft: prStats.draft || 0,
      pending_approval: prStats.pending_approval || 0,
      approved: prStats.approved || 0,
      rejected: prStats.rejected || 0,
      converted_to_po: prStats.converted_to_po || 0,
      cancelled: prStats.cancelled || 0,
    },
    posByStatus: {
      draft: poStats.draft || 0,
      pending_approval: poStats.pending_approval || 0,
      approved: poStats.approved || 0,
      sent: poStats.sent || 0,
      partially_received: poStats.partially_received || 0,
      received: poStats.received || 0,
      closed: poStats.closed || 0,
      cancelled: poStats.cancelled || 0,
    },
  };
};
