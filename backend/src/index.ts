import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set up PostgreSQL connection pool
const pool = new Pool();
app.use(express.json());
app.use(cors());

// GET /items - retrieve a specific item from the database
app.get('/items', async (req, res) => {
  const { barcode_id} = req.query;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    const result = await pool.query(
      'SELECT row_to_json(item) AS item FROM item WHERE barcode_id = $1', [barcode_id]);
    if (result.rows.length === 0) return res.status(204).json({ error: 'Item not found' });
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to retrieve items from backend', details: err });
  }
});

app.put('/items', async (req, res) => {
  const { barcode_id, name, description, primary_location, secondary_location, total_quantity } = req.body;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    const existing = await pool.query(
      'SELECT * FROM item WHERE barcode_id = $1',
      [barcode_id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const toIntOrNULL = (val: string | number | null | undefined) => {
      if (val === undefined || val === null || val === '') return null;
      return parseInt(String(val), 10);
    };
    const updated = await pool.query(
      `UPDATE item SET
         name = $1,
         description = $2,
         primary_location = ROW($3, $4)::LOCATION,
         secondary_location = ROW($5, $6)::LOCATION,
         total_quantity = $7
         WHERE barcode_id = $8 RETURNING *`,
      [
        name,
        description,
        toIntOrNULL(primary_location?.quantity),
        primary_location?.location ?? null,
        toIntOrNULL(secondary_location?.quantity),
        secondary_location?.location ?? null,
        toIntOrNULL(total_quantity),
        barcode_id
      ]
    );
    return res.status(200).json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item', details: err });
  }
});


// POST /items - add or update an item with provided barcode
app.post('/items', async (req, res) => {
  const { barcode_id, barcode_type, name, description, primary_location, secondary_location, total_quantity } = req.body;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    // Check if item exists
    console.log(primary_location);
    const existing = await pool.query(
      'SELECT * FROM item WHERE barcode_id = $1',
      [barcode_id]
    );
    if (existing.rows.length > 0) {
      // Update total_quantity
      const updated = await pool.query(
        'UPDATE item SET total_quantity = total_quantity + $1 WHERE barcode_id = $2 RETURNING *',
        [total_quantity, barcode_id]
      );
      if (primary_location) {
        const updatedPrimary = await pool.query(
          'UPDATE item SET primary_location = $1 WHERE barcode_id = $2 RETURNING *',
          [primary_location, barcode_id]
        );
        // Add to return status?
      }
      if (secondary_location) {
        const updatedSecondary = await pool.query(
          'UPDATE item SET secondary_location = $1 WHERE barcode_id = $2 RETURNING *',
          [secondary_location, barcode_id]
        );
        // Add to return status?
      }
      return res.status(200).json(updated.rows[0]);
    } else {
      // Insert new item

      const result = await pool.query(
        `INSERT INTO item (barcode_id, barcode_type, name, description, primary_location, secondary_location, total_quantity)
         VALUES ($1, $2, $3, $4, ROW($5, $6)::LOCATION, ROW($7, $8)::LOCATION, $9) RETURNING *`,
        [
          barcode_id,
          barcode_type,
          name,
          description,
          primary_location?.quantity ?? null,
          primary_location?.location ?? null,
          secondary_location?.quantity ?? null,
          secondary_location?.location ?? null,
          total_quantity
        ]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert/update item', details: err });
  }
});

//post orders
app.post('/orders', async (req, res) => {
  const { items } = req.body; // items: [{ barcode_id, quantity }, ...]
  console.log(res);
  console.log(items);
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Insert new order
    const orderResult = await client.query(
      'INSERT INTO orders DEFAULT VALUES RETURNING order_id, order_date'
    );
    const order_id = orderResult.rows[0].order_id;

    // 2. Insert each item into order_items
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

//get orders
app.get('/orders', async (req, res) => {
  try {
    // Fetch all orders and their items
    const result = await pool.query(`
      SELECT o.order_id, o.order_date, oi.barcode_id, oi.quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ORDER BY o.order_id DESC, oi.barcode_id
    `);
    // Group items by order_id
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

// GET /employees - list employees with account info (if any)
app.get('/employees', async (req, res) => {
  try {
    // Join employee and account on email (if present)
    const result = await pool.query(`
      SELECT account_id, first_name, last_name, employee.email as email, account_type FROM employee, account WHERE account.email = employee.email
      ORDER BY account_id`);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees', details: err });
  }
});

// PUT /employees/:account_id - update employee and account info
app.put('/employees/:account_id', async (req, res) => {
  const { account_id } = req.params;
  const { first_name, last_name, email, phone_number, address, city, state, zip_code, position, account_type, password } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Update employee
    await client.query(
      `UPDATE employee SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone_number = $4,
        address = $5,
        city = $6,
        state = $7,
        zip_code = $8,
        position = $9
      WHERE account_id = $10`,
      [first_name, last_name, email, phone_number, address, city, state, zip_code, position, account_id]
    );
    // Update account (if fields provided)
    if (account_type || password) {
      const updates = [];
      const values = [];
      let idx = 1;
      if (account_type) { updates.push(`account_type = $${idx++}`); values.push(account_type); }
      if (password) { updates.push(`password = $${idx++}`); values.push(password); }
      if (updates.length > 0) {
        values.push(email); // email is used as identifier
        await client.query(
          `UPDATE account SET ${updates.join(', ')} WHERE email = $${idx}`,
          values
        );
      }
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Employee/account updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update employee/account', details: err });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(new Date().toISOString());
});