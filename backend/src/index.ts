import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set up PostgreSQL connection pool
const pool = new Pool();
app.use(express.json());

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
  const { barcode_id, barcode_type, name, description, primary_location, secondary_location, total_quantity } = req.body;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', details: err });
  }
});

//get orders
app.post('/orders', async (req, res) => {
  const { barcode_id, barcode_type, name, description, primary_location, secondary_location, total_quantity } = req.body;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    
  } catch (err) {
    res.status(500).json({ error: 'Failed to get order', details: err });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(new Date().toISOString());
});