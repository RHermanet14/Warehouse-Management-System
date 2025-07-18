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
      SELECT o.order_id, o.order_date, oi.barcode_id, oi.quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ORDER BY o.order_id DESC, oi.barcode_id
    `);
    const ordersMap: Record<string, { order_id: number, order_date: string, items: Array<{ barcode_id: string, quantity: number }> }> = {};
    for (const row of result.rows) {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          order_id: row.order_id,
          order_date: row.order_date,
          items: []
        };
      }
      if (row.barcode_id) {
        ordersMap[row.order_id].items.push({
          barcode_id: row.barcode_id,
          quantity: row.quantity
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
  const locations = String(locationsParam).split(',').map(l => l.trim()).filter(Boolean);
  try {
    const result = await pool.query(`
      SELECT o.order_id,
             array_agg(DISTINCT l.location ORDER BY l.location) as order_locations
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN item i ON oi.barcode_id = i.barcode_id
      LEFT JOIN LATERAL (
        VALUES ((i.primary_location).location), ((i.secondary_location).location)
      ) AS l(location) ON TRUE
      WHERE l.location IS NOT NULL
        AND o.status = 'pending'
      GROUP BY o.order_id
    `);
    const selectedSet = new Set(locations.map(l => l.toLowerCase()));
    const found = result.rows.find(row =>
      (row.order_locations as string[]).every((loc: string) => selectedSet.has(loc.toLowerCase()))
    );
    if (!found) {
      return res.status(404).json({ error: 'No pending orders found for selected locations' });
    }
    
    // Mark the order as in_progress when starting fulfillment
    await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2',
      ['in_progress', found.order_id]
    );
    
    return res.status(200).json({ order_id: found.order_id });
  } catch (err) {
    console.error('[by-locations] Error:', err);
    res.status(500).json({ error: 'Failed to get order by locations', details: err });
  }
});

// GET /orders/:order_id/items - get all items for an order
router.get('/:order_id/items', async (req, res) => {
  const { order_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT i.barcode_id, i.name, i.description, oi.quantity, oi.picked_quantity,
             (i.primary_location).location as primary_location,
             (i.primary_location).quantity as primary_quantity,
             (i.secondary_location).location as secondary_location,
             (i.secondary_location).quantity as secondary_quantity
      FROM order_items oi
      JOIN item i ON oi.barcode_id = i.barcode_id
      WHERE oi.order_id = $1
      ORDER BY i.name
    `, [order_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order items', details: err });
  }
});

// PUT /orders/:order_id/items/:barcode_id - update picked_quantity for an order item
router.put('/:order_id/items/:barcode_id', async (req, res) => {
  const { order_id, barcode_id } = req.params;
  const { picked_quantity, picked_location } = req.body;
  
  if (typeof picked_quantity !== 'number' || picked_quantity <= 0) {
    return res.status(400).json({ error: 'picked_quantity must be a positive number' });
  }
  if (!picked_location || typeof picked_location !== 'string') {
    return res.status(400).json({ error: 'picked_location is required and must be a string' });
  }
  try {
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update picked_quantity in order_items
      const result = await client.query(
        `UPDATE order_items
         SET picked_quantity = picked_quantity + $1
         WHERE order_id = $2 AND barcode_id = $3
         RETURNING *`,
        [picked_quantity, order_id, barcode_id]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order item not found' });
      }

      // Update the correct location quantity and total_quantity
      await client.query(`
        UPDATE item
        SET
          primary_location = CASE
            WHEN (primary_location).location = $1
              THEN ROW((primary_location).quantity - $2, (primary_location).location)::LOCATION
            ELSE primary_location
          END,
          secondary_location = CASE
            WHEN (secondary_location).location = $1
              THEN ROW((secondary_location).quantity - $2, (secondary_location).location)::LOCATION
            ELSE secondary_location
          END,
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

export default router; 