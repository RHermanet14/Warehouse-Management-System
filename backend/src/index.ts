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
  const { barcode_id, barcode_type } = req.query;
  if (!barcode_id || !barcode_type) {
    return res.status(400).json({ error: 'barcode_id and barcode_type are required' });
  }
  try {
    const result = await pool.query(
      'SELECT row_to_json(item) AS item FROM item WHERE barcode_id = $1 AND barcode_type = $2', [barcode_id, barcode_type]);
    if (result.rows.length === 0) return res.status(204).json({ error: 'Item not found' });
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve items from backend', details: err });
  }
});

// POST /items - add or update an item with provided barcode
app.post('/items', async (req, res) => {
  const { barcode_id, barcode_type, name, total_quantity } = req.body;
  if (!barcode_id || !barcode_type) {
    return res.status(400).json({ error: 'barcode_id and barcode_type are required' });
  }
  try {
    // Check if item exists
    const existing = await pool.query(
      'SELECT * FROM item WHERE barcode_id = $1 AND barcode_type = $2',
      [barcode_id, barcode_type]
    );
    if (existing.rows.length > 0) {
      // Update total_quantity
      const updated = await pool.query(
        'UPDATE item SET total_quantity = total_quantity + $1 WHERE barcode_id = $2 AND barcode_type = $3 RETURNING *',
        [total_quantity, barcode_id, barcode_type]
      );
      return res.status(200).json(updated.rows[0]);
    } else {
      // Insert new item
      const result = await pool.query(
        `INSERT INTO item (barcode_id, barcode_type, name, description, primary_location, secondary_location, total_quantity)
         VALUES ($1, $2, $3, NULL, NULL, NULL, $4) RETURNING *`,
        [barcode_id, barcode_type, name, total_quantity]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert/update item', details: err });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 