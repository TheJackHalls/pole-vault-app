import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';

export const AppPage = () => {
  const { user, signOut } = useAuth();

  return (
    <AppShell title="Your dashboard" helper="You're signed in and ready to log practice sessions.">
      <section className="card">
        <h2 className="card-title">Welcome back</h2>
        <p className="card-description">
          Signed in as <strong>{user?.email ?? 'Unknown user'}</strong>
        </p>
        {user?.emailVerified ? (
          <div className="status-message success">Email verified</div>
        ) : (
          <div className="status-message warning">
            Email not verified yet. Check your inbox to verify your account.
          </div>
        )}
        <button className="secondary-button" type="button" onClick={() => signOut()}>
          Sign out
        </button>
      </section>
    </AppShell>
  );
};
