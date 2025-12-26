import { getConnection } from '../../database/connection';
import { ProductionDashboard } from '../../types/dashboard';

export const getProductionDashboard = async (): Promise<ProductionDashboard> => {
  const connection = await getConnection();

  const [statusCounts] = await connection.query<any[]>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM production_orders`
  );

  const [delayedOrders] = await connection.query<any[]>(
    `SELECT COUNT(*) as delayed_count
    FROM production_orders
    WHERE status IN ('scheduled', 'in_progress')
    AND required_date < NOW()`
  );

  const [completedOrders] = await connection.query<any[]>(
    `SELECT 
      COUNT(*) as total_completed,
      SUM(CASE WHEN updated_at <= required_date THEN 1 ELSE 0 END) as on_time
    FROM production_orders
    WHERE status = 'completed'
    AND updated_at IS NOT NULL`
  );

  const stats = statusCounts[0];
  const delayed = delayedOrders[0];
  const completed = completedOrders[0];

  const completionRate = completed.total_completed > 0 
    ? (completed.on_time / completed.total_completed) * 100 
    : 0;

  return {
    totalOrders: stats.total || 0,
    ordersByStatus: {
      draft: stats.draft || 0,
      scheduled: stats.scheduled || 0,
      in_progress: stats.in_progress || 0,
      completed: stats.completed || 0,
      cancelled: stats.cancelled || 0,
    },
    inProgressOrders: stats.in_progress || 0,
    delayedOrders: delayed.delayed_count || 0,
    completionRate: Number(completionRate.toFixed(2)),
  };
};
