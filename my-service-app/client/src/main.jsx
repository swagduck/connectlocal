import { StrictMode } from 'react'
import { render } from 'react-dom'
import './index.css'
import App from './App.jsx'

// Unregister service workers in development mode to avoid conflicts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) {
          console.log('Service Worker unregistered:', registration.scope);
        }
      }).catch(function(error) {
        console.error('Error unregistering service worker:', error);
      });
    }
  }).catch(function(error) {
    console.error('Error getting service worker registrations:', error);
  });
}

render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root')
)
