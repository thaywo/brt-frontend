import React, { useState, useEffect } from 'react';
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

// Configure axios
axios.defaults.baseURL = 'http://localhost:1111/api';
axios.defaults.headers.common['Accept'] = 'application/json';

// Configure Laravel Echo
window.Pusher = Pusher;

function App() {
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

  useEffect(() => {
    // Check for email verification from URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('email_verified') === 'true') {
      alert('Email verified successfully! You can now access all features.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const initializeEcho = () => {
    const echoInstance = new Echo({
      broadcaster: 'pusher',
      key: process.env.REACT_APP_PUSHER_KEY || 'your-pusher-key',
      cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'mt1',
      forceTLS: true
    });

    // Listen for BRT events
    echoInstance.channel('brts')
      .listen('.brt.created', (e) => {
        addNotification('New BRT Created', `BRT ${e.brt_code} with ${e.reserved_amount} BLU created by ${e.user.name}`);
      })
      .listen('.brt.updated', (e) => {
        addNotification('BRT Updated', `BRT ${e.brt_code} updated`);
      })
      .listen('.brt.deleted', (e) => {
        addNotification('BRT Deleted', `BRT ${e.brt_code} deleted`);
      });

    setEcho(echoInstance);
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
      
      // Check email verification status
      const verificationResponse = await axios.get('/email/verification-status');
      setEmailVerified(verificationResponse.data.verified);
      
      if (verificationResponse.data.verified) {
        initializeEcho();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
        
        <div className="demo-info">
          <h3>Demo Note:</h3>
          <p>Since email is set to log driver, check your Laravel log file at:</p>
          <code>storage/logs/laravel.log</code>
          <p>Look for the verification URL after registration.</p>
        </div>
      </div>
    );
  }

  // Show email verification notice if not verified
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
          <p>
            If you're using the log mail driver, check your Laravel log file at:
            <br />
            <code>storage/logs/laravel.log</code>
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

export default App;