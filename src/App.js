import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import './App.css';

// Components
import Login from './components/Login';
import Register from './components/Register';
import BrtList from './components/BrtList';
import BrtForm from './components/BrtForm';
import Dashboard from './components/Dashboard';
import Notifications from './components/Notifications';
import EmailVerification from './components/EmailVerification';

// Configure axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:1111/api';
axios.defaults.headers.common['Accept'] = 'application/json';

// Configure Laravel Echo
window.Pusher = Pusher;

function MainApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('brts');
  const [notifications, setNotifications] = useState([]);
  const [echo, setEcho] = useState(null);
  const [emailVerified, setEmailVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const initializeEcho = () => {
    try {
      const echoInstance = new Echo({
        broadcaster: 'pusher',
        key: process.env.REACT_APP_PUSHER_KEY,
        cluster: process.env.REACT_APP_PUSHER_CLUSTER,
        forceTLS: true,
        enabledTransports: ['ws', 'wss']
      });

      const channel = echoInstance.channel('brts');

      channel.listen('.brt.created', (e) => {
        addNotification('New BRT Created', `BRT ${e.brt_code} with ${e.reserved_amount} BLU created by ${e.user.name}`);
      });

      channel.listen('.brt.updated', (e) => {
        addNotification('BRT Updated', `BRT ${e.brt_code} updated`);
      });

      channel.listen('.brt.deleted', (e) => {
        addNotification('BRT Deleted', `BRT ${e.brt_code} deleted`);
      });

      setEcho(echoInstance);
    } catch (error) {
      console.error('Failed to initialize real-time notifications');
    }
  };

  const addNotification = (title, message) => {
    const notification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get('/me');
      setUser(response.data.user);
      
      const verificationResponse = await axios.get('/email/verification-status');
      setEmailVerified(verificationResponse.data.verified);
      
      if (verificationResponse.data.verified) {
        initializeEcho();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, accessToken, isEmailVerified) => {
    setUser(userData);
    setToken(accessToken);
    setEmailVerified(isEmailVerified);
    localStorage.setItem('token', accessToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    if (isEmailVerified) {
      initializeEcho();
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setToken(null);
    setEmailVerified(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    if (echo) {
      echo.disconnect();
    }
  };

  const resendVerificationEmail = async () => {
    setResendingEmail(true);
    try {
      const response = await axios.post('/email/verification-notification', {
        email: user.email
      });
      alert(response.data.message || 'Verification email sent! Please check your inbox.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!token || !user) {
    return (
      <div className="auth-container">
        <h1>BRT Management System</h1>
        <div className="auth-forms">
          <Login onLogin={handleLogin} />
          <Register onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  if (emailVerified === false) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>BRT Management System</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>
        
        <div className="email-verification-notice">
          <h2>Email Verification Required</h2>
          <p>
            Please verify your email address to access all features. 
            We've sent a verification link to <strong>{user.email}</strong>.
          </p>
          <button 
            onClick={resendVerificationEmail} 
            disabled={resendingEmail}
            className="resend-btn"
          >
            {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="refresh-btn"
          >
            I've Verified My Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>BRT Management System</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          {emailVerified && <span className="verified-badge">✓ Verified</span>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === 'brts' ? 'active' : ''} 
          onClick={() => setActiveTab('brts')}
        >
          My BRTs
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Create BRT
        </button>
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''} 
          onClick={() => setActiveTab('notifications')}
        >
          Notifications ({notifications.length})
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'brts' && <BrtList />}
        {activeTab === 'create' && <BrtForm onSuccess={() => setActiveTab('brts')} />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'notifications' && <Notifications notifications={notifications} />}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;