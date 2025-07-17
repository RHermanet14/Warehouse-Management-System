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
  console.log('[by-locations] Parsed locations:', locations);
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
      GROUP BY o.order_id
    `);
    const selectedSet = new Set(locations.map(l => l.toLowerCase()));
    const found = result.rows.find(row =>
      (row.order_locations as string[]).every((loc: string) => selectedSet.has(loc.toLowerCase()))
    );
    if (!found) {
      return res.status(404).json({ error: 'No orders found for selected locations' });
    }
    return res.status(200).json({ order_id: found.order_id });
  } catch (err) {
    console.error('[by-locations] Error:', err);
    res.status(500).json({ error: 'Failed to get order by locations', details: err });
  }
});

export default router; 