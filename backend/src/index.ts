import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import itemsRouter, { setPool as setItemsPool } from './routes/items';
import ordersRouter, { setPool as setOrdersPool } from './routes/orders';
import employeesRouter, { setPool as setEmployeesPool } from './routes/employees';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set up PostgreSQL connection pool
const pool = new Pool();
app.use(express.json());
app.use(cors());

// Inject pool into routers
setItemsPool(pool);
setOrdersPool(pool);
setEmployeesPool(pool);

// Use routers
app.use('/items', itemsRouter);
app.use('/orders', ordersRouter);
app.use('/employees', employeesRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(new Date().toISOString());
});