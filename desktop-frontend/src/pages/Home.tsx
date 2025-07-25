import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AddOutline, Admin, Menu, Reload, Search } from '@rsuite/icons';
import './Home.css';

const dashboardPages = [
  { label: 'View Orders', path: 'vieworders', icon: <Menu /> },
  { label: 'Update', path: 'update', icon: <Reload /> },
  { label: 'Search', path: 'search', icon: <Search /> },
  { label: 'Manage Accounts', path: 'manageaccounts', icon: <Admin /> },
  { label: 'Create Orders', path: 'createorders', icon: <AddOutline />, color: 'danger' },
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
              className={`dashboard-btn ${page.color || 'primary'}`}
              onClick={() => navigate(`/dashboard/${page.path}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 48, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(page.icon, { style: { fontSize: 48 } })}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                {page.label.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
} 