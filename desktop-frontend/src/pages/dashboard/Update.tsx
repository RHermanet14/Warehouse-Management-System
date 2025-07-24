import React, { useState, useEffect } from 'react';
import type { Item, Location } from "../../../../frontend/constants/Types";
import axios from 'axios';
import './Update.css';

interface Area { area_id: number; name: string; }

// Add a local type override for Location to allow area_id: number | '' and quantity as string
type LocalLocation = Omit<Location, 'area_id' | 'quantity'> & { area_id: number | '', quantity: string };

export default function Update() {
  const [barcodeId, setBarcodeId] = useState('');
  const [item, setItem] = useState<Item | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    total_quantity: '',
  });
  const [locations, setLocations] = useState<LocalLocation[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/items/areas')
      .then(res => {
        if (Array.isArray(res.data)) {
          setAreas(res.data);
        } else {
          console.error('Areas API did not return an array:', res.data);
          setAreas([]);
        }
      })
      .catch(err => {
        console.error('Error fetching areas:', err);
        setAreas([]);
      });
  }, []);

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
        if (data.item.locations && Array.isArray(data.item.locations)) {
          setLocations(data.item.locations.map((loc: any) => ({
            ...loc,
            area_id: typeof loc.area_id === 'number' ? loc.area_id : '',
            quantity: loc.quantity !== undefined && loc.quantity !== null ? String(loc.quantity) : ''
          })));
        } else {
          setLocations([]);
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

  const handleLocationChange = (index: number, field: keyof LocalLocation | 'area_id', value: string | number) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setLocations(newLocations);
  };

  const addLocation = () => {
    setLocations([
      ...locations,
      { quantity: '', bin: '', type: '', area_id: '' }
    ]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    // Frontend validation for locations
    for (const loc of locations) {
      if (!loc.bin || !loc.bin.trim()) {
        setError('Each location must have a name.');
        setLoading(false);
        return;
      }
      if (!loc.quantity || isNaN(Number(loc.quantity))) {
        setError('Each location must have a valid quantity.');
        setLoading(false);
        return;
      }
      if (!loc.type || !loc.type.trim()) {
        setError('Each location must have a type.');
        setLoading(false);
        return;
      }
      if (loc.area_id === undefined || loc.area_id === null || loc.area_id === '' || isNaN(Number(loc.area_id))) {
        setError('Each location must have a valid area selected.');
        setLoading(false);
        return;
      }
    }
    try {
      await axios.put('/items', {
        barcode_id: barcodeId,
        name: form.name,
        description: form.description,
        total_quantity: form.total_quantity,
        locations: locations.filter(loc => loc.bin.trim() !== '').map(loc => ({
          ...loc,
          quantity: loc.quantity === '' ? 0 : parseInt(loc.quantity, 10)
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
                  value={location.bin}
                  onChange={e => handleLocationChange(index, 'bin', e.target.value)}
                  className="update-input"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={location.quantity}
                  onChange={e => handleLocationChange(index, 'quantity', e.target.value)}
                  className="update-input"
                />
                <select
                  value={location.type}
                  onChange={e => handleLocationChange(index, 'type', e.target.value)}
                  className="update-input"
                >
                  <option value="" disabled>Location Type</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="overflow">Overflow</option>
                  <option value="storage">Storage</option>
                </select>
                <select
                  value={location.area_id === '' ? '' : String(location.area_id)}
                  onChange={e => handleLocationChange(index, 'area_id', e.target.value === '' ? '' : Number(e.target.value))}
                  className="update-input"
                >
                  <option value="" disabled>Select Area</option>
                  {areas.map(area => (
                    <option key={area.area_id} value={area.area_id}>{area.name}</option>
                  ))}
                </select>
                <span className="update-area-label">
                  {areas.find(a => a.area_id === location.area_id)?.name || ''}
                </span>
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
              disabled={!areas.length}
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