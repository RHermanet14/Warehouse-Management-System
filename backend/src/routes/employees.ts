import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();
let pool: Pool;
export function setPool(p: Pool) { pool = p; }

// GET /employees - list employees with account info (if any)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT employee.*, account.account_type FROM employee
      LEFT JOIN account ON account.email = employee.email
      ORDER BY account_id`);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees', details: err });
  }
});

// PUT /employees/:account_id - update employee and account info
router.put('/:account_id', async (req, res) => {
  const { account_id } = req.params;
  const { first_name, last_name, email, phone_number, address, city, state, zip_code, position, account_type, password } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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
    if (account_type || password) {
      const updates = [];
      const values = [];
      let idx = 1;
      if (account_type) { updates.push(`account_type = $${idx++}`); values.push(account_type); }
      if (password) { updates.push(`password = $${idx++}`); values.push(password); }
      if (updates.length > 0) {
        values.push(email);
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

export default router; 