import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../lib/authErrors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignupPage = () => {
  const { signUp, hasConfig } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!emailPattern.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
      setSuccess('Account created! Check your email to verify your account.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Create account" helper="Set up your coach login to sync across devices.">
      {!hasConfig ? (
        <div className="status-message warning">
          Missing Firebase configuration. Add VITE_FIREBASE_* values in .env.local before using auth.
        </div>
      ) : null}
      <section className="card auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            className="form-input"
            type="email"
            placeholder="coach@school.edu"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
          <label className="form-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            className="form-input"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
          <label className="form-label" htmlFor="signup-confirm">
            Confirm password
          </label>
          <input
            id="signup-confirm"
            className="form-input"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            required
          />
          {error ? <div className="form-message" role="alert">{error}</div> : null}
          {success ? <div className="form-message success" role="status">{success}</div> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className="auth-footer">
          <Link className="text-link" to="/login">
            Already have an account? Log in
          </Link>
        </div>
      </section>
    </AppShell>
  );
};
