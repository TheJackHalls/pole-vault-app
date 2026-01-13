import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../lib/authErrors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ResetPasswordPage = () => {
  const { resetPassword, hasConfig } = useAuth();
  const [email, setEmail] = useState('');
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

    try {
      setLoading(true);
      await resetPassword(email);
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Reset password" helper="We will email you a reset link.">
      {!hasConfig ? (
        <div className="status-message warning">
          Missing Firebase configuration. Add VITE_FIREBASE_* values in .env.local before using auth.
        </div>
      ) : null}
      <section className="card auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="reset-email">
            Email address
          </label>
          <input
            id="reset-email"
            className="form-input"
            type="email"
            placeholder="coach@school.edu"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
          {error ? <div className="form-message" role="alert">{error}</div> : null}
          {success ? <div className="form-message success" role="status">{success}</div> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <div className="auth-footer">
          <Link className="text-link" to="/login">
            Back to log in
          </Link>
        </div>
      </section>
    </AppShell>
  );
};
