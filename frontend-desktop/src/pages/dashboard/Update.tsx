import React, { useState } from 'react';
import axios from 'axios';
import './Update.css';

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
    <div className="update-container">
      <h2 className="update-title">Update Item Information</h2>
      <form onSubmit={handleFetch} className="update-fetch-form">
        <input
          type="text"
          placeholder="Enter Barcode ID"
          value={barcodeId}
          onChange={e => setBarcodeId(e.target.value)}
          className="update-input"
        />
        <button type="submit" disabled={loading} className="update-btn">
          Fetch
        </button>
      </form>
      {error && <div className="update-error">{error}</div>}
      {message && <div className="update-success">{message}</div>}
      {item && (
        <form onSubmit={handleUpdate} className="update-form">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="update-input"
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="update-input"
          />
          <input
            type="number"
            name="total_quantity"
            placeholder="Total Quantity"
            value={form.total_quantity}
            onChange={handleChange}
            className="update-input"
          />
          <input
            type="number"
            name="primary_location_quantity"
            placeholder="Primary Location Quantity"
            value={form.primary_location_quantity}
            onChange={handleChange}
            className="update-input"
          />
          <input
            type="text"
            name="primary_location_location"
            placeholder="Primary Location"
            value={form.primary_location_location}
            onChange={handleChange}
            className="update-input"
          />
          <input
            type="number"
            name="secondary_location_quantity"
            placeholder="Secondary Location Quantity"
            value={form.secondary_location_quantity}
            onChange={handleChange}
            className="update-input"
          />
          <input
            type="text"
            name="secondary_location_location"
            placeholder="Secondary Location"
            value={form.secondary_location_location}
            onChange={handleChange}
            className="update-input"
          />
          <button type="submit" disabled={loading} className="update-btn update-btn-success">
            Update Item
          </button>
        </form>
      )}
    </div>
  );
}