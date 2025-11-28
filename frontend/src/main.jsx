import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UserRecordsWindow from './components/UserRecordsWindow';

const urlParams = new URLSearchParams(window.location.search);
const isUserRecordsWindow = urlParams.get('userRecordsWindow') === '1';
const userParam = urlParams.get('user');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isUserRecordsWindow && userParam ? (
      <UserRecordsWindow />
    ) : (
      <App />
    )}
  </StrictMode>,
)
