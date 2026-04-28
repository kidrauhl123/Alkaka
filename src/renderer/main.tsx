import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import PetView from './components/pet/PetView';
import './index.css';
import { store } from './store';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const isPetWindow = new URLSearchParams(window.location.search).get('window') === 'pet';

if (isPetWindow) {
  document.documentElement.classList.add('pet-window');
  document.documentElement.style.backgroundColor = 'transparent';
  document.body.style.backgroundColor = 'transparent';
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {isPetWindow ? (
        <PetView />
      ) : (
        <Provider store={store}>
          <App />
        </Provider>
      )}
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render the app:', error);
}
