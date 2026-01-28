// src/admin/index.jsx
// Entry point for Admin Dashboard

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Admin index.jsx loaded');
console.log('🔍 Looking for element:', document.getElementById('admin-root'));

const rootElement = document.getElementById('admin-root');

if (!rootElement) {
  console.error('❌ admin-root element not found!');
} else {
  console.log('✅ admin-root element found, creating React root...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ React root created, rendering App...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ App rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
  }
}