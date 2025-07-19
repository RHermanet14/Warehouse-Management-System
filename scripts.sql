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