/**
 * Main entry point for the React application
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import NeuroFinDashboard from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

console.log('Starting app initialization...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  console.log('Root element found, creating React root...');
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created, rendering app...');
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <NeuroFinDashboard />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Failed to load application</h1>
        <p>${error.message}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px;">${error.stack || 'No stack trace'}</pre>
        <button onclick="window.location.reload()">Reload</button>
      </div>
    `;
  }
}

