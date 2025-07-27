import React, { useState } from 'react';
import axios from 'axios';
import './EmployeeLogs.css';

interface EmployeeLog {
  order_id: number;
  barcode_id: string;
  item_name: string;
  quantity: number;
  picked_quantity: number;
  completion_time: string;
  employee_name: string;
}

const EmployeeLogs: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [logs, setLogs] = useState<EmployeeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  const handleSearch = async () => {
    if (!employeeId.trim()) {
      setError('Please enter an employee ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    const url = `${backendUrl}/orders/employee-logs/${employeeId}`;
    try {
      const response = await axios.get(url);
      setLogs(response.data as EmployeeLog[]);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No logs found for this employee ID');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch employee logs');
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmployeeId('');
    setLogs([]);
    setError('');
    setSearched(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="employee-logs-container">
      <h1 className="employee-logs-title">Employee Picking Logs</h1>
      
      {/* Search Form */}
      <div className="search-form">
        <input
          type="text"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="employee-id-input"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        {searched && (
          <button
            onClick={handleClear}
            className="clear-button"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Results */}
      {logs.length > 0 && (
        <div>
          <h2 className="results-title">
            Picking History for Employee {employeeId}
          </h2>
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr className="table-header">
                  <th>Order ID</th>
                  <th>Item Name</th>
                  <th>Barcode ID</th>
                  <th className="center">Quantity Needed</th>
                  <th className="center">Quantity Picked</th>
                  <th>Line Completed At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell order-id">{log.order_id}</td>
                    <td className="table-cell">{log.item_name}</td>
                    <td className="table-cell barcode">{log.barcode_id}</td>
                    <td className="table-cell center">{log.quantity}</td>
                    <td className="table-cell center">{log.picked_quantity}</td>
                    <td className="table-cell">{formatDate(log.completion_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="total-items">
            Total items completed: {logs.length}
          </div>
        </div>
      )}

      {/* No Results */}
      {searched && !loading && logs.length === 0 && !error && (
        <div className="no-results">
          No picking history found for employee {employeeId}
        </div>
      )}
    </div>
  );
};

export default EmployeeLogs;
