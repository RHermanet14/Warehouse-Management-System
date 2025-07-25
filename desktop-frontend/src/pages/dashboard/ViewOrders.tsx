import { useEffect, useState } from 'react';
import axios from 'axios';
import './ViewOrders.css';

interface OrderItem {
  barcode_id: string;
  quantity: number;
}

interface Order {
  order_id: number;
  order_date: string;
  status: string;
  items: OrderItem[];
}

export default function ViewOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3000/orders');
        const data = res.data as Order[];
        setOrders(data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleExpand = (order_id: number) => {
    setExpanded(prev => ({ ...prev, [order_id]: !prev[order_id] }));
  };

  return (
    <div className="view-orders-container">
      <h2 className="view-orders-title">View Orders</h2>
      {loading && <div className="view-orders-loading">Loading...</div>}
      {error && <div className="view-orders-error">{error}</div>}
      {orders.length === 0 && !loading && <div className="view-orders-empty">No orders found.</div>}
      <ul className="view-orders-list">
        {orders.map(order => (
          <li key={order.order_id} className="view-orders-list-item">
            <div className="view-orders-header">
              <div className="view-orders-header-info">
                <strong className="view-orders-order-id">Order #{order.order_id}</strong>
                <span className="view-orders-order-date">({new Date(order.order_date).toLocaleString()})</span>
                <span className="view-orders-order-status">[{order.status.charAt(0).toUpperCase() + order.status.slice(1)}]</span>
              </div>
              <button
                onClick={() => toggleExpand(order.order_id)}
                className={`view-orders-toggle-btn${expanded[order.order_id] ? ' active' : ''}`}
              >
                {expanded[order.order_id] ? 'Hide Items' : 'Show Items'}
              </button>
            </div>
            {expanded[order.order_id] && (
              <div>
                <table className="view-orders-table">
                  <thead>
                    <tr>
                      <th>Barcode ID</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.barcode_id}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
} 