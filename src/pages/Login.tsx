import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../auth/AuthProvider';
import { hasFirebaseConfig } from '../firebase/firebase';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Log in"
      description="Use your email and password to access your vault dashboard."
      footer={
        <div className="link-row">
          <Link to="/signup">Create an account</Link>
          <Link to="/reset-password">Forgot password?</Link>
        </div>
      }
    >
      {!hasFirebaseConfig ? (
        <div className="notice warning">
          Missing Firebase configuration. Add VITE_FIREBASE_* values in .env.local before using
          auth features.
        </div>
      ) : null}
      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="coach@school.edu"
          required
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />
        {error ? (
          <div className="notice error" role="alert">
            {error}
          </div>
        ) : null}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </PageLayout>
  );
};

export default Login;
