import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

// Dynamically import all dashboard pages
const dashboardModules = import.meta.glob('./pages/dashboard/*.tsx', { eager: true });

const dashboardRoutes = Object.entries(dashboardModules).map(([path, module]: any) => {
  // Extract the file name (e.g., 'ViewOrders' from './pages/dashboard/ViewOrders.tsx')
  const match = path.match(/dashboard\/(.*)\.tsx$/);
  const name = match ? match[1] : '';
  // Route path should be lowercase
  return (
    <Route
      key={name}
      path={`/dashboard/${name.toLowerCase()}`}
      element={React.createElement(module.default)}
    />
  );
});

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {dashboardRoutes}
      </Routes>
    </Router>
  );
}

export default App;
