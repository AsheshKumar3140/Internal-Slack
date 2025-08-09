import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import Home from './components/Home';
import Complaint from './components/Complaint';
import Team from './components/Team';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (user && token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    navigate('/home');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Navigate to="/home" replace /> : <Auth onAuthSuccess={handleAuthSuccess} defaultMode="signin" />
          } 
        />
        <Route 
          path="/home" 
          element={
            isAuthenticated ? <Home onSignOut={handleSignOut} /> : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/complaint" 
          element={
            isAuthenticated ? <Complaint /> : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/team" 
          element={
            isAuthenticated ? <Team /> : <Navigate to="/" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
