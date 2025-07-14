import React, { useState } from 'react';
import axios from 'axios';
import './CreateOrders.css';

export default function CreateOrders() {
  const [barcodeId, setBarcodeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<{ barcode_id: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!barcodeId.trim() || !quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError('Please enter a valid barcode ID and quantity.');
      return;
    }
    setItems([...items, { barcode_id: barcodeId.trim(), quantity: Number(quantity) }]);
    setBarcodeId('');
    setQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (items.length === 0) {
      setError('Add at least one item to the order.');
      return;
    }
    setLoading(true);
    try {
      console.log(items);
      await axios.post('http://localhost:3000/orders', { items });
      console.log("Does it get to here?");
      setMessage('Order created successfully!');
      setItems([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-orders-container">
      <h2 className="create-orders-title">Create New Order</h2>
      <form onSubmit={handleAddItem} className="create-orders-add-form">
        <input
          type="text"
          placeholder="Barcode ID"
          value={barcodeId}
          onChange={e => setBarcodeId(e.target.value)}
          className="create-orders-input"
          style={{ flex: 2 }}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="create-orders-input"
          style={{ flex: 1 }}
        />
        <button type="submit" className="create-orders-btn">
          Add Item
        </button>
      </form>
      {error && <div className="create-orders-error">{error}</div>}
      {message && <div className="create-orders-success">{message}</div>}
      <div className="create-orders-items">
        <h3 className="create-orders-items-title">Order Items</h3>
        {items.length === 0 && <div style={{ color: '#888' }}>No items added yet.</div>}
        <ul className="create-orders-items-list">
          {items.map((item, idx) => (
            <li key={idx} className="create-orders-item">
              <span className="create-orders-item-barcode">{item.barcode_id}</span>
              <span className="create-orders-item-quantity">{item.quantity}</span>
              <button onClick={() => handleRemoveItem(idx)} className="create-orders-remove-btn">Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmitOrder}>
        <button type="submit" disabled={loading} className="create-orders-btn create-orders-btn-success">
          Submit Order
        </button>
      </form>
    </div>
  );
} 