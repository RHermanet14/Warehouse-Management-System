import React, { useState } from 'react';
import type { Item } from "../../../../frontend/constants/Types"
import axios from 'axios';

export default function Search() {
  const [barcodeId, setBarcodeId] = useState('');
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!barcodeId.trim()) {
      setError('Please enter a barcode ID');
      return;
    }
    setIsLoading(true);
    setSearched(true);
    setItem(null);
    try {
      const res = await axios.get(`/items?barcode_id=${encodeURIComponent(barcodeId)}`);
      const data = res.data as { item?: Item };
      if (res.status === 204 || !data.item) {
        setItem(null);
        console.log(data);
        console.log(res);
        console.log(res.status);
        setError('No item found with this barcode ID');
      } else {
        setItem(data.item);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error searching for item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setBarcodeId('');
    setItem(null);
    setSearched(false);
    setError('');
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Search by Barcode ID</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Enter Barcode ID"
          value={barcodeId}
          onChange={e => setBarcodeId(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: 10, fontSize: 16, borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        {searched && (
          <button type="button" onClick={handleClear} style={{ padding: 10, fontSize: 16, borderRadius: 4, background: '#FF3B30', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Clear Search
          </button>
        )}
      </form>
      {error && <div style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>{error}</div>}
      {item && (
        <div style={{ marginTop: 24, background: '#f5f5f5', borderRadius: 6, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#222', fontWeight: 'bold', fontSize: 22, textAlign: 'center' }}>Item Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', rowGap: 10, columnGap: 16, alignItems: 'start' }}>
            {Object.entries(item).map(([key, value]) => {
              if (key === 'primary_location' && value && typeof value === 'object') {
                let loc = value as { quantity?: number; location?: string };
                return [
                  <React.Fragment key="primary_location_quantity">
                    <span style={{ fontWeight: 600, textAlign: 'left', color: '#111', display: 'block' }}>{'Primary Location Quantity'}</span>
                    <span style={{ fontWeight: 400, color: '#111', textAlign: 'left' }}>{loc?.quantity ?? 'N/A'}</span>
                  </React.Fragment>,
                  <React.Fragment key="primary_location_location">
                    <span style={{ fontWeight: 600, textAlign: 'left', color: '#111', display: 'block' }}>{'Primary Location'}</span>
                    <span style={{ fontWeight: 400, color: '#111', textAlign: 'left' }}>{loc?.location ?? 'N/A'}</span>
                  </React.Fragment>
                ];
              }
              if (key === 'secondary_location' && value && typeof value === 'object') {
                let loc = value as { quantity?: number; location?: string };
                return [
                  <React.Fragment key="secondary_location_quantity">
                    <span style={{ fontWeight: 600, textAlign: 'left', color: '#111', display: 'block' }}>{'Secondary Location Quantity'}</span>
                    <span style={{ fontWeight: 400, color: '#111', textAlign: 'left' }}>{loc?.quantity ?? 'N/A'}</span>
                  </React.Fragment>,
                  <React.Fragment key="secondary_location_location">
                    <span style={{ fontWeight: 600, textAlign: 'left', color: '#111', display: 'block' }}>{'Secondary Location'}</span>
                    <span style={{ fontWeight: 400, color: '#111', textAlign: 'left' }}>{loc?.location ?? 'N/A'}</span>
                  </React.Fragment>
                ];
              }
              // Format label: replace underscores with spaces and capitalize words
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <React.Fragment key={key}>
                  <span style={{ fontWeight: 600, textAlign: 'left', color: '#111', display: 'block' }}>{label}</span>
                  <span style={{ fontWeight: 400, color: '#111', textAlign: 'left' }}>{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}</span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 