import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css';
import { iniciarTema } from './styles/tema'
import App from './App.jsx'

iniciarTema()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)