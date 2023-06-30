import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

const rootElement = document.getElementById('root');

// Use React 18's createRoot API for rendering the app and handle unavailable root element
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.info('Application - rootElement not found');
}
