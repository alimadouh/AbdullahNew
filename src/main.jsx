import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PHQ9PatientForm from './components/PHQ9PatientForm.jsx'
import './index.css'

const phq9Match = window.location.pathname.match(/^\/phq9\/(ar|en)\/([a-f0-9-]+)$/i)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {phq9Match ? <PHQ9PatientForm lang={phq9Match[1]} sessionId={phq9Match[2]} /> : <App />}
  </React.StrictMode>,
)
