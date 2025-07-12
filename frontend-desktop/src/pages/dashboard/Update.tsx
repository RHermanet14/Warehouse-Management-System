import React, { useState } from 'react';
import axios from 'axios';

export default function Update() {
  const [barcodeId, setBarcodeId] = useState('');
  const [item, setItem] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    total_quantity: '',
    primary_location_quantity: '',
    primary_location_location: '',
    secondary_location_quantity: '',
    secondary_location_location: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.get(`/items?barcode_id=${encodeURIComponent(barcodeId)}`);
      const data = res.data as { item?: any };
      if (!data.item) {
        setError('Item not found');
        setItem(null);
      } else {
        setItem(data.item);
        setForm({
          name: data.item.name || '',
          description: data.item.description || '',
          total_quantity: data.item.total_quantity || '',
          primary_location_quantity: data.item.primary_location?.quantity || '',
          primary_location_location: data.item.primary_location?.location || '',
          secondary_location_quantity: data.item.secondary_location?.quantity || '',
          secondary_location_location: data.item.secondary_location?.location || '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    console.log("Attempting to do put request");
    try {
      await axios.put('/items', {
        barcode_id: barcodeId,
        name: form.name,
        description: form.description,
        total_quantity: form.total_quantity,
        primary_location: {
          quantity: form.primary_location_quantity,
          location: form.primary_location_location ?? null,
        },
        secondary_location: {
          quantity: form.secondary_location_quantity,
          location: form.secondary_location_location ?? null,
        },
      });
      setMessage('Item updated successfully!');
    } catch (err: any) {
      console.log("No dice");
      setError(err.response?.data?.error || 'Error updating item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, color: 'black' }}>Update Item Information</h2>
      <form onSubmit={handleFetch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Enter Barcode ID"
          value={barcodeId}
          onChange={e => setBarcodeId(e.target.value)}
          style={{ flex: 1, padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: 8, fontSize: 16, borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          Fetch
        </button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
      {item && (
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="number"
            name="total_quantity"
            placeholder="Total Quantity"
            value={form.total_quantity}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="number"
            name="primary_location_quantity"
            placeholder="Primary Location Quantity"
            value={form.primary_location_quantity}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            name="primary_location_location"
            placeholder="Primary Location"
            value={form.primary_location_location}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="number"
            name="secondary_location_quantity"
            placeholder="Secondary Location Quantity"
            value={form.secondary_location_quantity}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            name="secondary_location_location"
            placeholder="Secondary Location"
            value={form.secondary_location_location}
            onChange={handleChange}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button type="submit" disabled={loading} style={{ padding: 10, fontSize: 16, borderRadius: 4, background: '#43a047', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Update Item
          </button>
        </form>
      )}
    </div>
  );
}