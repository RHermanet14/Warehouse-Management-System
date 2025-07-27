-- Delete all completed orders -----------------------------

-- Delete all order_items for completed orders
DELETE FROM order_items
WHERE order_id IN (SELECT order_id FROM orders WHERE status = 'completed');

-- Delete all completed orders
DELETE FROM orders WHERE status = 'completed';
------------------------------------------------------------

-- See current order_id
SELECT last_value FROM orders_order_id_seq;

-- Reset order to Pending status because stupid debugging
UPDATE orders SET status = 'pending' WHERE order_id = 6;

select * from orders, order_items where orders.order_id = order_items.order_id and orders.order_id = 6;

-- Accumulate quantities
UPDATE item
SET total_quantity = (
  SELECT COALESCE(SUM((loc).quantity), 0)
  FROM unnest(locations) AS loc
)
WHERE locations IS NOT NULL;

-- Eventually reset Docker database
 DROP DATABASE your_database_name;

ALTER TABLE order_items ADD COLUMN picked_by INT REFERENCES employee(account_id);

ALTER TABLE order_items 
ADD COLUMN completed_at TIMESTAMP DEFAULT NULL;