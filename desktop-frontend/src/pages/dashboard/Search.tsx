import React, { useState } from 'react';
import type { Item } from "../../../../shared/constants/Types";
import axios from 'axios';
import './search.css';

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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await axios.get(`${backendUrl}/items?barcode_id=${encodeURIComponent(barcodeId)}`);
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

  const renderItemInfo = (item: Item) => {
    const infoElements: React.ReactNode[] = [];
    
    // Add basic item information
    Object.entries(item).forEach(([key, value]) => {
      // Skip locations array as we'll handle it separately
      if (key === 'locations') return;
      
      if (key === 'primary_location' && value && typeof value === 'object') {
        let loc = value as { quantity?: number; location?: string };
        infoElements.push(
          <React.Fragment key="primary_location_quantity">
            <span className="item-info-label">{'Primary Location Quantity'}</span>
            <span className="item-info-value">{loc?.quantity ?? 'N/A'}</span>
          </React.Fragment>
        );
        infoElements.push(
          <React.Fragment key="primary_location_location">
            <span className="item-info-label">{'Primary Location'}</span>
            <span className="item-info-value">{loc?.location ?? 'N/A'}</span>
          </React.Fragment>
        );
        return;
      }
      if (key === 'secondary_location' && value && typeof value === 'object') {
        let loc = value as { quantity?: number; location?: string };
        infoElements.push(
          <React.Fragment key="secondary_location_quantity">
            <span className="item-info-label">{'Secondary Location Quantity'}</span>
            <span className="item-info-value">{loc?.quantity ?? 'N/A'}</span>
          </React.Fragment>
        );
        infoElements.push(
          <React.Fragment key="secondary_location_location">
            <span className="item-info-label">{'Secondary Location'}</span>
            <span className="item-info-value">{loc?.location ?? 'N/A'}</span>
          </React.Fragment>
        );
        return;
      }
      
      // Format label: replace underscores with spaces and capitalize words
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      infoElements.push(
        <React.Fragment key={key}>
          <span className="item-info-label">{label}</span>
          <span className="item-info-value">{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}</span>
        </React.Fragment>
      );
    });
    
    // Handle locations array in table format
    if (item.locations && Array.isArray(item.locations) && item.locations.length > 0) {
      infoElements.push(
        <React.Fragment key="locations_table">
          <span className="item-info-label">Locations</span>
          <div className="locations-table">
            <table className="locations-table-inner">
              <thead>
                <tr>
                  <th>Bin</th>
                  <th>Quantity</th>
                  <th>Type</th>
                  <th>Area</th>
                </tr>
              </thead>
              <tbody>
                {item.locations.map((location, index) => (
                  <tr key={index}>
                    <td>{(location as any).location || (location as any).bin}</td>
                    <td>{location.quantity}</td>
                    <td>{location.type}</td>
                    <td>{(location as any).area_name || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </React.Fragment>
      );
    }
    
    return infoElements;
  };

  return (
    <div className="search-container">
      <h2 className="search-title">Search by Barcode ID</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Enter Barcode ID"
          value={barcodeId}
          onChange={e => setBarcodeId(e.target.value)}
          className="search-input"
        />
        <button type="submit" disabled={isLoading} className="search-btn">
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        {searched && (
          <button type="button" onClick={handleClear} className="clear-btn">
            Clear Search
          </button>
        )}
      </form>
      {error && <div className="search-error">{error}</div>}
      {item && (
        <div className="item-info-container">
          <h3 className="item-info-title">Item Information</h3>
          <div className="item-info-grid">
            {renderItemInfo(item)}
          </div>
        </div>
      )}
    </div>
  );
} 