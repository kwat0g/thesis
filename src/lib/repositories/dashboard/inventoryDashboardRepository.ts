import { getConnection } from '../../database/connection';
import { InventoryDashboard } from '../../types/dashboard';

export const getInventoryDashboard = async (): Promise<InventoryDashboard> => {
  const connection = await getConnection();

  const [itemCounts] = await connection.query<any[]>(
    `SELECT COUNT(DISTINCT item_id) as total_items
    FROM inventory_balances`
  );

  const [stockStatus] = await connection.query<any[]>(
    `SELECT 
      SUM(CASE WHEN ib.quantity_available > i.reorder_level THEN 1 ELSE 0 END) as in_stock,
      SUM(CASE WHEN ib.quantity_available <= i.reorder_level AND ib.quantity_available > 0 THEN 1 ELSE 0 END) as low_stock,
      SUM(CASE WHEN ib.quantity_available = 0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN ib.quantity_reserved > 0 THEN 1 ELSE 0 END) as reserved
    FROM inventory_balances ib
    JOIN items i ON ib.item_id = i.id`
  );

  const [lowStockItems] = await connection.query<any[]>(
    `SELECT 
      i.id as itemId,
      i.item_code as itemCode,
      i.item_name as itemName,
      ib.quantity_available as currentStock,
      i.reorder_level as minStock,
      ib.warehouse_id as warehouseId
    FROM inventory_balances ib
    JOIN items i ON ib.item_id = i.id
    WHERE ib.quantity_available <= i.reorder_level
    AND ib.quantity_available > 0
    ORDER BY (ib.quantity_available / NULLIF(i.reorder_level, 0)) ASC
    LIMIT 20`
  );

  const [stockValue] = await connection.query<any[]>(
    `SELECT SUM(ib.quantity_available * i.unit_cost) as total_value
    FROM inventory_balances ib
    JOIN items i ON ib.item_id = i.id`
  );

  const status = stockStatus[0];

  return {
    totalItems: itemCounts[0].total_items || 0,
    stockByStatus: {
      in_stock: status.in_stock || 0,
      low_stock: status.low_stock || 0,
      out_of_stock: status.out_of_stock || 0,
      reserved: status.reserved || 0,
    },
    lowStockItems: lowStockItems.map((item: any) => ({
      itemId: item.itemId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      currentStock: Number(item.currentStock),
      minStock: Number(item.minStock),
      warehouseId: item.warehouseId,
    })),
    totalStockValue: Number(stockValue[0].total_value || 0),
  };
};
