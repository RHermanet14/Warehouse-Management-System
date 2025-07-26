import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();
let pool: Pool;
export function setPool(p: Pool) { pool = p; }

// POST /orders - create a new order
router.post('/', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      'INSERT INTO orders DEFAULT VALUES RETURNING order_id, order_date'
    );
    const order_id = orderResult.rows[0].order_id;
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, barcode_id, quantity) VALUES ($1, $2, $3)',
        [order_id, item.barcode_id, item.quantity]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ order_id, order_date: orderResult.rows[0].order_date });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create order', details: err });
  } finally {
    client.release();
  }
});

// GET /orders - list all orders with items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.order_id, o.order_date, o.status, oi.barcode_id, oi.quantity, oi.picked_quantity,
             e.first_name, e.last_name,
             CONCAT(e.first_name, ' ', e.last_name) as picked_by_name
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN employee e ON oi.picked_by = e.account_id
      ORDER BY o.order_id DESC, oi.barcode_id
    `);
    const ordersMap: Record<string, { order_id: number, order_date: string, status: string, items: Array<{ barcode_id: string, quantity: number, picked_quantity?: number, picked_by_name?: string }> }> = {};
    for (const row of result.rows) {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          order_id: row.order_id,
          order_date: row.order_date,
          status: row.status,
          items: []
        };
      }
      if (row.barcode_id) {
        ordersMap[row.order_id].items.push({
          barcode_id: row.barcode_id,
          quantity: row.quantity,
          picked_quantity: row.picked_quantity,
          picked_by_name: row.picked_by_name
        });
      }
    }
    const orders = Object.values(ordersMap);
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get orders', details: err });
  }
});

// GET /orders/by-locations?locations=loc1,loc2,...
router.get('/by-locations', async (req, res) => {
  const locationsParam = req.query.locations;
  // Parse area_ids as integers
  const selectedAreaIds = String(locationsParam).split(',').map(l => parseInt(l.trim(), 10)).filter(id => !isNaN(id));
  try {
    const result = await pool.query(`
      SELECT o.order_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN item i ON oi.barcode_id = i.barcode_id
      WHERE o.status = 'pending'
      GROUP BY o.order_id
      HAVING bool_and(
        EXISTS (
          SELECT 1
          FROM unnest((i).locations) AS loc
          WHERE (loc).area_id = ANY($1)
        )
      )
      LIMIT 1
    `, [selectedAreaIds]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No pending orders found for selected locations' });
    }
    const found = result.rows[0];
    // Mark the order as in_progress when starting fulfillment
    await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2',
      ['in_progress', found.order_id]
    );
    return res.status(200).json({ order_id: found.order_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get order by locations', details: err });
  }
});

// GET /orders/:order_id/items - get all items for an order
router.get('/:order_id/items', async (req, res) => {
  const { order_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT oi.quantity, oi.picked_quantity,
             i.barcode_id, i.name, i.description, i.total_quantity,
             e.first_name, e.last_name,
             CONCAT(e.first_name, ' ', e.last_name) as picked_by_name,
             json_agg(
               json_build_object(
                 'quantity', loc.quantity,
                 'bin', loc.bin,
                 'type', loc.type,
                 'area_id', loc.area_id
               )
             ) as locations
      FROM order_items oi
      JOIN item i ON oi.barcode_id = i.barcode_id
      LEFT JOIN LATERAL unnest(i.locations) AS loc ON true
      LEFT JOIN employee e ON oi.picked_by = e.account_id
      WHERE oi.order_id = $1
      GROUP BY oi.quantity, oi.picked_quantity, i.barcode_id, i.name, i.description, i.total_quantity, e.first_name, e.last_name
      ORDER BY i.name
    `, [order_id]);
    // Return the data directly since it's already flattened
    const rows = result.rows.map(row => ({
      barcode_id: row.barcode_id,
      name: row.name,
      description: row.description,
      locations: row.locations || [],
      total_quantity: row.total_quantity,
      quantity: row.quantity,
      picked_quantity: row.picked_quantity,
      picked_by_name: row.picked_by_name
    }));
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order items', details: err });
  }
});

// PUT /orders/:order_id/items/:barcode_id - update picked_quantity for an order item
router.put('/:order_id/items/:barcode_id', async (req, res) => {
  const { order_id, barcode_id } = req.params;
  const { picked_quantity, picked_location, picked_by } = req.body;
  
  if (typeof picked_quantity !== 'number' || picked_quantity <= 0) {
    return res.status(400).json({ error: 'picked_quantity must be a positive number' });
  }
  if (!picked_location || typeof picked_location !== 'string') {
    return res.status(400).json({ error: 'picked_location is required and must be a string' });
  }
  try {
    // Check if picked_location is valid for this item
    const itemRes = await pool.query('SELECT row_to_json(item) as item FROM item WHERE barcode_id = $1', [barcode_id]);
    if (itemRes.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const locations = itemRes.rows[0].item.locations;
    // locations is now a JS array
    const valid = Array.isArray(locations) && locations.some(loc => {
      return String(loc.bin).trim().toLowerCase() === String(picked_location).trim().toLowerCase();
    });
    if (!valid) {
      return res.status(400).json({ error: 'Invalid location: this item does not have the specified location.' });
    }
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Update picked_quantity in order_items
      const result = await client.query(
        `UPDATE order_items
         SET picked_quantity = picked_quantity + $1, picked_by = $2
         WHERE order_id = $3 AND barcode_id = $4
         RETURNING *`,
        [picked_quantity, picked_by, order_id, barcode_id]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order item not found' });
      }
      // Update the correct location quantity in the locations array
      await client.query(`
        UPDATE item
        SET locations = ARRAY(
          SELECT
            CASE
              WHEN loc.bin = $1 THEN ROW(loc.quantity - $2, loc.bin, loc.type, loc.area_id)::LOCATION
              ELSE loc
            END
          FROM unnest(locations) AS loc
        ),
        total_quantity = total_quantity - $2
        WHERE barcode_id = $3
      `, [picked_location, picked_quantity, barcode_id]);
      // Check if all items in the order are fully picked
      const orderCompletionCheck = await client.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN oi.quantity <= oi.picked_quantity THEN 1 END) as completed_items
        FROM order_items oi
        WHERE oi.order_id = $1
      `, [order_id]);
      const { total_items, completed_items } = orderCompletionCheck.rows[0];
      // If all items are completed, mark order as completed
      if (total_items > 0 && total_items == completed_items) {
        await client.query(
          'UPDATE orders SET status = $1 WHERE order_id = $2',
          ['completed', order_id]
        );
      }
      await client.query('COMMIT');
      res.status(200).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update picked quantity', details: err });
  }
});

// PUT /orders/:order_id/reset - set order status back to pending
router.put('/:order_id/reset', async (req, res) => {
  const { order_id } = req.params;
  try {
    // Only reset if not completed
    const result = await pool.query(
      "UPDATE orders SET status = 'pending' WHERE order_id = $1 AND status = 'in_progress'",
      [order_id]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Order not in progress or already completed' });
    }
    res.status(200).json({ message: 'Order reset to pending' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset order', details: err });
  }
});

// POST /orders/areas/lookup - get area names for a list of area_ids
router.post('/areas/lookup', async (req, res) => {
  const { area_ids } = req.body;
  if (!Array.isArray(area_ids) || area_ids.length === 0) {
    return res.status(400).json({ error: 'area_ids must be a non-empty array' });
  }
  try {
    const result = await pool.query('SELECT area_id, name FROM area WHERE area_id = ANY($1)', [area_ids]);
    const areaMap = Object.fromEntries(result.rows.map((a: any) => [a.area_id, a.name]));
    res.status(200).json(areaMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to lookup areas', details: err });
  }
});

export default router; 