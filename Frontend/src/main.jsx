import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#e2e8f0',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#7c3aed', secondary: '#ffffff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
      }}
    />
  </React.StrictMode>,
)
