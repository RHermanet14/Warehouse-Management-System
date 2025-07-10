import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const dashboardPages = [
  { label: 'View Orders', path: 'vieworders'},
  { label: 'Update', path: 'update'},
  { label: 'Search', path: 'search' },
  { label: 'Manage Accounts', path: 'manageaccounts'},
  { label: 'Create Orders', path: 'createorders', color: 'warning' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <header className="app-header">Warehouse Admin Dashboard</header>
      <main className="app-main">
        <div className="dashboard-grid">
          {dashboardPages.map((page) => (
            <button
              key={page.path}
              className={`dashboard-btn ${page.color}`}
              onClick={() => navigate(`/dashboard/${page.path}`)}
            >
              {page.label.toUpperCase()}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
} 