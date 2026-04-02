import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import RegisterPage from './app/auth/register/page';
import LoginPage from './app/auth/login/page';
import AuthCallback from './app/auth/callback/page';
import Dashboard from './app/Dashboard';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* http://localhost:5173/login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* http://localhost:5173/register */}
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Powrót z Google Login */}
        <Route path="/auth-callback" element={<AuthCallback />} />

        {/* Strona główna przekierowuje do logowania */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Dowolny inny adres (404) przekierowuje do logowania */}
        <Route path="*" element={<Navigate to="/login" />} />

        {/*http://localhost:5173/dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

         {/*http://localhost:5173/dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;