import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function EmailVerification() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const hash = params.get('hash');
    const expires = params.get('expires');
    const signature = params.get('signature');

    if (!id || !hash) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    try {
      const response = await axios.get(
        `/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`,
        {
          headers: {
            'Authorization': undefined
          }
        }
      );
      
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      
      setTimeout(() => {
        navigate('/?email_verified=true');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 'Verification failed. The link may be expired.'
      );
    }
  };

  return (
    <div className="email-verification">
      <div className="verification-container">
        <h2>Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="verifying">
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="success">
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <p>Redirecting to login...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="error">
            <div className="error-icon">✗</div>
            <p>{message}</p>
            <button onClick={() => navigate('/')}>Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailVerification;

const emailVerificationStyles = `
.email-verification {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.verification-container {
  background: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.verification-container h2 {
  margin-bottom: 2rem;
}

.verifying .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-icon,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-icon {
  color: #4CAF50;
}

.error-icon {
  color: #f44336;
}

.verification-container button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.verification-container button:hover {
  background-color: #45a049;
}
`;