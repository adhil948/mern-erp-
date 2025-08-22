import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';  // Make sure path is correct
import AppTheme from './shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <AppTheme>
        <CssBaseline />
        <App />
      </AppTheme>
    </AppProvider>
  </React.StrictMode>
);
