import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageAccounts.css';

interface Employee {
  account_id: number;
  first_name: string;
  last_name: string;
  email: string;         // Use a single email field
  account_type?: string; // If you want to show account info
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  position?: string;
}

export default function ManageAccounts() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3000/employees');
        setEmployees(res.data as Employee[]);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error fetching employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const startEdit = (emp: Employee) => {
    setEditingId(emp.account_id);
    setEditForm(emp);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // TODO: Implement saveEdit to update employee/account info
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await axios.put(`http://localhost:3000/employees/${editingId}`, editForm);
      setEmployees(prev => prev.map(emp => emp.account_id === editingId ? { ...emp, ...editForm } as Employee : emp));
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error saving changes');
    }
  };

  return (
    <div className="manage-accounts-container">
      <h2 className="manage-accounts-title">Manage Employee Accounts</h2>
      {loading && <div className="manage-accounts-loading">Loading...</div>}
      {error && <div className="manage-accounts-error">{error}</div>}
      <table className="manage-accounts-table">
        <thead>
          <tr>
            <th>Account ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>City</th>
            <th>State</th>
            <th>Zip</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.account_id}>
              {editingId === emp.account_id ? (
                <>
                  <td><input className="manage-accounts-input" name="account_id" value={editForm.account_id} disabled /></td>
                  <td><input className="manage-accounts-input" name="first_name" value={editForm.first_name || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="last_name" value={editForm.last_name || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="email" value={editForm.email || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="phone_number" value={editForm.phone_number || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="address" value={editForm.address || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="city" value={editForm.city || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="state" value={editForm.state || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="zip_code" value={editForm.zip_code || ''} onChange={handleChange} /></td>
                  <td><input className="manage-accounts-input" name="position" value={editForm.position || ''} onChange={handleChange} /></td>
                  <td>
                    <button className="manage-accounts-btn" onClick={saveEdit}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{emp.account_id}</td>
                  <td>{emp.first_name}</td>
                  <td>{emp.last_name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone_number}</td>
                  <td>{emp.address}</td>
                  <td>{emp.city}</td>
                  <td>{emp.state}</td>
                  <td>{emp.zip_code}</td>
                  <td>{emp.position}</td>
                  <td>
                    <button onClick={() => startEdit(emp)}>Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 