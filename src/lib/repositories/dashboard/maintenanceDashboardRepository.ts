import { getConnection } from '../../database/connection';
import { MaintenanceDashboard } from '../../types/dashboard';

export const getMaintenanceDashboard = async (): Promise<MaintenanceDashboard> => {
  const connection = await getConnection();

  const [statusCounts] = await connection.query<any[]>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM maintenance_work_orders`
  );

  const [openWorkOrders] = await connection.query<any[]>(
    `SELECT COUNT(*) as open_count
    FROM maintenance_work_orders
    WHERE status IN ('pending', 'approved', 'scheduled', 'in_progress')`
  );

  const [frequentBreakdowns] = await connection.query<any[]>(
    `SELECT 
      m.id as machineId,
      m.machine_code as machineCode,
      m.machine_name as machineName,
      COUNT(mwo.id) as breakdownCount,
      MAX(mwo.requested_date) as lastBreakdownDate
    FROM machines m
    JOIN maintenance_work_orders mwo ON m.id = mwo.machine_id
    WHERE mwo.maintenance_type = 'corrective'
    AND mwo.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    GROUP BY m.id, m.machine_code, m.machine_name
    HAVING COUNT(mwo.id) >= 3
    ORDER BY breakdownCount DESC
    LIMIT 10`
  );

  const [overdueSchedules] = await connection.query<any[]>(
    `SELECT COUNT(*) as overdue_count
    FROM maintenance_schedules
    WHERE is_active = 1
    AND next_maintenance_date < CURDATE()`
  );

  const stats = statusCounts[0];

  return {
    openWorkOrders: openWorkOrders[0].open_count || 0,
    workOrdersByStatus: {
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      scheduled: stats.scheduled || 0,
      in_progress: stats.in_progress || 0,
      completed: stats.completed || 0,
      cancelled: stats.cancelled || 0,
    },
    machinesWithFrequentBreakdowns: frequentBreakdowns.map((item: any) => ({
      machineId: item.machineId,
      machineCode: item.machineCode,
      machineName: item.machineName,
      breakdownCount: item.breakdownCount,
      lastBreakdownDate: item.lastBreakdownDate ? new Date(item.lastBreakdownDate) : undefined,
    })),
    overdueMaintenanceSchedules: overdueSchedules[0].overdue_count || 0,
  };
};
