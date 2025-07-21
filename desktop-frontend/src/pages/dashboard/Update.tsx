import React, { useState } from 'react';
import type { Item, Location } from "../../../../frontend/constants/Types";
import axios from 'axios';
import './Update.css';

export default function Update() {
  const [barcodeId, setBarcodeId] = useState('');
  const [item, setItem] = useState<Item | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    total_quantity: '',
  });
  const [locations, setLocations] = useState<Location[]>([]);
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
      const data = res.data as { item?: Item };
      if (!data.item) {
        setError('Item not found');
        setItem(null);
      } else {
        setItem(data.item);
        setForm({
          name: data.item.name || '',
          description: data.item.description || '',
          total_quantity: data.item.total_quantity?.toString() || '',
        });
        // Handle locations array or fallback to old format
        if (data.item.locations && Array.isArray(data.item.locations)) {
          setLocations(data.item.locations);
        } else {
          // Convert old format to new format
          const newLocations: Location[] = [];
          if (data.item.primary_location) {
            newLocations.push({
              quantity: data.item.primary_location.quantity || 0,
              location: data.item.primary_location.location || '',
              type: 'primary',
            });
          }
          if (data.item.secondary_location) {
            newLocations.push({
              quantity: data.item.secondary_location.quantity || 0,
              location: data.item.secondary_location.location || '',
              type: 'secondary',
            });
          }
          setLocations(newLocations);
        }
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

  const handleLocationChange = (index: number, field: keyof Location, value: string | number) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setLocations(newLocations);
  };

  const addLocation = () => {
    setLocations([...locations, { quantity: 0, location: '', type: 'primary' }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/items', {
        barcode_id: barcodeId,
        name: form.name,
        description: form.description,
        total_quantity: form.total_quantity,
        locations: locations.filter(loc => loc.location.trim() !== '').map(loc => ({
          ...loc,
          quantity: parseInt(String(loc.quantity).replace(/^0+(?=\d)/, ''), 10) || 0
        })),
      });
      setMessage('Item updated successfully!');
    } catch (err: any) {
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
          {/* Locations Section */}
          <div className="update-locations-section">
            <h3>Locations</h3>
            {locations.map((location, index) => (
              <div key={index} className="update-location-item">
                <input
                  type="text"
                  placeholder="Location Name"
                  value={location.location}
                  onChange={e => handleLocationChange(index, 'location', e.target.value)}
                  className="update-input"
                />
                <input
                  type="text"
                  placeholder="Quantity"
                  value={location.quantity === 0 ? '' : location.quantity}
                  onChange={e => handleLocationChange(index, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                  className="update-input"
                />
                <select
                  value={location.type}
                  onChange={e => handleLocationChange(index, 'type', e.target.value)}
                  className="update-input"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="overflow">Overflow</option>
                  <option value="storage">Storage</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  className="update-remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLocation}
              className="update-add-btn"
            >
              Add Location
            </button>
          </div>
          <button type="submit" disabled={loading} className="update-btn update-btn-success">
            Update Item
          </button>
        </form>
      )}
    </div>
  );
}