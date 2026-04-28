import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import PetView from './components/pet/PetView';
import { store } from './store';
import { parsePetAppearanceParams } from './utils/petAppearance';
import { normalizePetStatus } from './utils/petStatus';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const searchParams = new URLSearchParams(window.location.search);
const isPetWindow = searchParams.get('window') === 'pet';

if (isPetWindow) {
  document.documentElement.classList.add('pet-window');
  document.documentElement.style.backgroundColor = 'transparent';
  document.body.style.backgroundColor = 'transparent';
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {isPetWindow ? (
        <PetView appearance={parsePetAppearanceParams(searchParams)} status={normalizePetStatus(searchParams.get('petStatus'))} />
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
