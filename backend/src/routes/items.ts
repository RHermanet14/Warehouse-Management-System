import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

// The pool will be injected from index.ts
let pool: Pool;
export function setPool(p: Pool) { pool = p; }

// GET /items - retrieve a specific item from the database
router.get('/', async (req, res) => {
  const { barcode_id } = req.query;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    const result = await pool.query(
      'SELECT row_to_json(item) AS item FROM item WHERE barcode_id = $1', [barcode_id]);
    if (result.rows.length === 0) return res.status(204).json({ error: 'Item not found' });
    const item = result.rows[0].item;
    // Expand locations with area name
    if (item.locations && Array.isArray(item.locations)) {
      const areaIds = [...new Set(item.locations.map((loc: any) => loc.area_id).filter((id: any) => id != null))];
      let areaMap: Record<number, string> = {};
      if (areaIds.length > 0) {
        const areaRes = await pool.query('SELECT area_id, name FROM area WHERE area_id = ANY($1)', [areaIds]);
        areaMap = Object.fromEntries(areaRes.rows.map((a: any) => [a.area_id, a.name]));
      }
      item.locations = item.locations.map((loc: any) => ({ ...loc, area_name: areaMap[loc.area_id] || '' }));
    }
    return res.status(200).json({ item });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to retrieve items from backend', details: err });
  }
});

// PUT /items - update an item
router.put('/', async (req, res) => {
  const { barcode_id, name, description, locations, total_quantity } = req.body;
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

    // Validate locations: area_id and type must be present and valid
    if (locations && Array.isArray(locations)) {
      for (const loc of locations) {
        if (!loc.type || typeof loc.type !== 'string' || !loc.type.trim()) {
          return res.status(400).json({ error: 'Each location must have a type.' });
        }
        if (loc.area_id === undefined || loc.area_id === null || loc.area_id === '' || isNaN(Number(loc.area_id))) {
          return res.status(400).json({ error: 'Each location must have a valid area selected.' });
        }
      }
    }
    
    const toIntOrNULL = (val: string | number | null | undefined) => {
      if (val === undefined || val === null || val === '') return null;
      return parseInt(String(val), 10);
    };

    // Convert locations array to PostgreSQL format
    const locationsArray = locations ? locations.map((loc: any) => 
      `ROW(${toIntOrNULL(loc.quantity)}, '${loc.bin}', '${loc.type}', ${toIntOrNULL(loc.area_id)})::LOCATION`
    ).join(', ') : '';

    const updated = await pool.query(
      `UPDATE item SET
         name = $1,
         description = $2,
         locations = ARRAY[${locationsArray}],
         total_quantity = $3
         WHERE barcode_id = $4 RETURNING *`,
      [
        name,
        description,
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
router.post('/', async (req, res) => {
  const { barcode_id, barcode_type, name, description, locations, total_quantity } = req.body;
  if (!barcode_id) {
    return res.status(400).json({ error: 'barcode_id is required' });
  }
  try {
    const existing = await pool.query(
      'SELECT * FROM item WHERE barcode_id = $1',
      [barcode_id]
    );
    
    // Validate locations: area_id and type must be present and valid
    if (locations && Array.isArray(locations)) {
      for (const loc of locations) {
        if (!loc.type || typeof loc.type !== 'string' || !loc.type.trim()) {
          return res.status(400).json({ error: 'Each location must have a type.' });
        }
        if (loc.area_id === undefined || loc.area_id === null || loc.area_id === '' || isNaN(Number(loc.area_id))) {
          return res.status(400).json({ error: 'Each location must have a valid area selected.' });
        }
      }
    }

    const toIntOrNULL = (val: string | number | null | undefined) => {
      if (val === undefined || val === null || val === '') return null;
      return parseInt(String(val), 10);
    };

    // Convert locations array to PostgreSQL format
    const locationsArray = locations ? locations.map((loc: any) => 
      `ROW(${toIntOrNULL(loc.quantity)}, '${loc.bin}', '${loc.type}', ${toIntOrNULL(loc.area_id)})::LOCATION`
    ).join(', ') : '';

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE item SET total_quantity = total_quantity + $1 WHERE barcode_id = $2 RETURNING *',
        [total_quantity, barcode_id]
      );
      if (locations && locations.length > 0) {
        await pool.query(
          `UPDATE item SET locations = ARRAY[${locationsArray}] WHERE barcode_id = $1 RETURNING *`,
          [barcode_id]
        );
      }
      return res.status(200).json(updated.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO item (barcode_id, barcode_type, name, description, locations, total_quantity)
         VALUES ($1, $2, $3, $4, ARRAY[${locationsArray}], $5) RETURNING *`,
        [
          barcode_id,
          barcode_type,
          name,
          description,
          toIntOrNULL(total_quantity)
        ]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert/update item', details: err });
  }
});

// GET /areas - return all areas
router.get('/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT area_id, name FROM area ORDER BY name');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch areas', details: err });
  }
});

export default router; 