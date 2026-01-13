import PageLayout from '../components/PageLayout';
import { useAuth } from '../auth/AuthProvider';

const AppHome = () => {
  const { user, signOutUser } = useAuth();

  return (
    <PageLayout
      title="Vault dashboard"
      description="Your authenticated app shell is ready for the next slice."
    >
      <div className="card">
        <p className="body-text">
          You are signed in as <strong>{user?.email ?? 'coach'}</strong>.
        </p>
        <button className="secondary" type="button" onClick={signOutUser}>
          Sign out
        </button>
      </div>
    </PageLayout>
  );
};

export default AppHome;
