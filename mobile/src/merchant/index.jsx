// src/merchant/index.jsx
// Entry point for merchant admin portal

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🚀 Merchant index.jsx loaded');
console.log('🔍 Looking for merchant-root element:', document.getElementById('merchant-root'));
console.log('💾 localStorage merchantToken:', localStorage.getItem('merchantToken'));
console.log('💾 localStorage merchantData:', localStorage.getItem('merchantData'));

const container = document.getElementById('merchant-root');

if (!container) {
  console.error('❌ merchant-root element not found!');
} else {
  console.log('✅ merchant-root element found, creating React root...');
  try {
    const root = createRoot(container);
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
