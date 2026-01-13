import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../auth/AuthProvider';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setSuccess('Password reset email sent. Check your inbox to continue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Reset password"
      description="We will email you a secure link to reset your password."
      footer={
        <div className="link-row">
          <Link to="/login">Back to log in</Link>
        </div>
      }
    >
      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="reset-email">Email address</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="coach@school.edu"
          required
        />
        {error ? (
          <div className="notice error" role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="notice success" role="status">
            {success}
          </div>
        ) : null}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset email'}
        </button>
      </form>
    </PageLayout>
  );
};

export default ResetPassword;
