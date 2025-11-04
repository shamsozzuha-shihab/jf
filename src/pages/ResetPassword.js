import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaKey, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import apiService from '../services/api';
import { validatePassword, validationMessages } from '../utils/validation';
import './Auth.css';

const ResetPassword = () => {
  const { token: rawToken } = useParams();
  const navigate = useNavigate();
  
  // Decode token from URL in case it has special characters
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false); // Start as false so form shows immediately
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Always set verifying to false after a short delay to ensure form shows
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 500);
    
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setVerifying(false);
    } else {
      // Verify the token (non-blocking - form will still show)
      verifyToken(token).catch(() => {
        // Silently handle errors - don't block rendering
        setVerifying(false);
      });
    }
    
    return () => clearTimeout(timer);
  }, [token]);

  const verifyToken = async (token) => {
    try {
      setVerifying(true);
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), 10000)
      );
      
      await Promise.race([
        apiService.verifyResetToken(token),
        timeoutPromise
      ]);
      
      setTokenValid(true);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Token verification error:', err);
      // Don't block the form - user can still try to reset
      // Only show warning, not blocking error - user can still try
      if (err.message && err.message.includes('Invalid or expired')) {
        // Don't set error state - just log it, allow user to try anyway
        console.warn('⚠️ Token verification failed, but you can still try to reset');
      }
      // For network/timeout errors, silently fail and let user try anyway
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Validate password
    const validation = validatePassword(value);
    if (!value) {
      setPasswordError(validationMessages.password.required);
    } else if (!validation.isValid) {
      setPasswordError(validationMessages.password.weak);
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Validate confirmation
    if (!value) {
      setConfirmError('Please confirm your password');
    } else if (value !== password) {
      setConfirmError(validationMessages.password.mismatch);
    } else {
      setConfirmError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('Password does not meet requirements');
      setLoading(false);
      return;
    }

    try {
      await apiService.resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="auth-header">
              <div className="auth-icon success">
                <FaCheckCircle />
              </div>
              <h1 className="auth-title">Password Reset Successful!</h1>
              <p className="auth-subtitle">Your password has been updated</p>
            </div>

            <div className="reset-password-info">
              <div style={{
                background: '#d4edda',
                border: '2px solid #28a745',
                padding: '25px',
                borderRadius: '10px',
                textAlign: 'center',
                margin: '20px 0'
              }}>
                <p style={{margin: 0, color: '#155724', fontSize: '18px', fontWeight: 'bold'}}>
                  ✅ Your password has been successfully reset!
                </p>
                <p style={{margin: '15px 0 0 0', color: '#155724'}}>
                  You can now login with your new password.
                </p>
              </div>

              <p style={{textAlign: 'center', color: '#666'}}>
                Redirecting to login page in 3 seconds...
              </p>
            </div>

            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                Go to Login Now
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Always render the form, even if there are errors
  return (
    <div className="auth-page" style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <div className="auth-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-header">
            <div className="auth-icon">
              <FaKey />
            </div>
            <h1 className="auth-title">Reset Your Password</h1>
            <p className="auth-subtitle">Enter your new password below</p>
            {token && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Token: {token.substring(0, 20)}...
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {verifying && (
              <motion.div 
                className="info-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: '#e3f2fd',
                  border: '1px solid #2196f3',
                  color: '#1976d2',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div className="spinner-small"></div>
                Verifying reset link...
              </motion.div>
            )}
            {error && error !== 'Invalid or expired reset link. Please request a new password reset.' && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FaExclamationTriangle />
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FaLock /> New Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`form-input ${passwordError ? 'error' : ''}`}
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordError && (
                <motion.div 
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {passwordError}
                </motion.div>
              )}
              <div style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <FaLock /> Confirm New Password
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`form-input ${confirmError ? 'error' : ''}`}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {confirmError && (
                <motion.div 
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {confirmError}
                </motion.div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading || !token || verifying}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Resetting Password...
                </>
              ) : (
                <>
                  <FaKey />
                  Reset Password
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="auth-info"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Password Requirements</h2>
          <div className="info-list">
            <div className="info-item">
              <div className="info-icon">🔒</div>
              <div>
                <h3>Strong & Secure</h3>
                <p>At least 8 characters with a mix of uppercase, lowercase, and numbers.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">⏰</div>
              <div>
                <h3>Limited Time</h3>
                <p>Reset links expire after 1 hour for your security.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">✅</div>
              <div>
                <h3>Instant Update</h3>
                <p>Your new password will be active immediately after reset.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

