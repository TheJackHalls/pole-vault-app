import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../lib/authErrors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const { signIn, hasConfig } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!emailPattern.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      navigate('/app');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Log in" helper="Use your email and password to access your vault dashboard.">
      {!hasConfig ? (
        <div className="status-message warning">
          Missing Firebase configuration. Add VITE_FIREBASE_* values in .env.local before using auth.
        </div>
      ) : null}
      <section className="card auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            className="form-input"
            type="email"
            placeholder="coach@school.edu"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="form-input"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
          {error ? <div className="form-message" role="alert">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <div className="auth-footer">
          <Link className="text-link" to="/signup">
            Create an account
          </Link>
          <Link className="text-link" to="/reset-password">
            Forgot password?
          </Link>
        </div>
      </section>
    </AppShell>
  );
};
