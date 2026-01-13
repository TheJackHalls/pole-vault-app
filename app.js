import { auth, hasFirebaseConfig } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const app = document.getElementById('app');

const authState = {
  user: null,
  loading: true,
};

const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback(authState));
};

const subscribeToAuth = callback => {
  subscribers.add(callback);
  callback(authState);
  return () => subscribers.delete(callback);
};

const initAuthProvider = () => {
  if (!auth) {
    authState.loading = false;
    notifySubscribers();
    return;
  }

  onAuthStateChanged(auth, user => {
    authState.user = user;
    authState.loading = false;
    notifySubscribers();
  });
};

const getPath = () => {
  let path = window.location.pathname || '/login';
  if (path.endsWith('/index.html')) {
    path = path.replace('/index.html', '') || '/login';
  }
  if (path === '/') {
    return '/login';
  }
  return path;
};

const navigate = path => {
  if (getPath() === path) return;
  window.history.pushState({}, '', path);
  render();
};

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const createLabel = (text, htmlFor) => {
  const label = createElement('label', 'form-label', text);
  label.htmlFor = htmlFor;
  return label;
};

const createInput = (id, type, placeholder, autocomplete) => {
  const input = document.createElement('input');
  input.id = id;
  input.type = type;
  input.placeholder = placeholder;
  input.className = 'form-input';
  input.autocomplete = autocomplete || '';
  input.required = true;
  return input;
};

const renderHeader = (title, helper) => {
  const header = createElement('header', 'top-header');
  const wordmark = createElement('div', 'wordmark', 'TAYKOF');
  const subtitle = createElement('div', 'shell-subtitle', 'Vault Coach Pro');
  const screenTitle = createElement('h1', 'screen-title', title);
  header.append(wordmark, subtitle, screenTitle);
  if (helper) {
    const helperText = createElement('p', 'screen-helper', helper);
    header.append(helperText);
  }
  return header;
};

const renderStatusMessage = (type, message) => {
  if (!message) return null;
  const status = createElement('div', `status-message ${type}`);
  status.textContent = message;
  return status;
};

const renderConfigWarning = () => {
  if (hasFirebaseConfig) return null;
  const warning = createElement('div', 'status-message warning');
  warning.textContent =
    'Missing Firebase configuration. Add VITE_FIREBASE_* values in .env.local before using auth features.';
  return warning;
};

const withLayout = (content, options = {}) => {
  const shell = createElement('div', 'app-shell');
  const main = createElement('main', 'screen');
  main.append(renderHeader(options.title || 'Welcome', options.helper || ''));
  if (options.banner) {
    main.append(options.banner);
  }
  if (options.status) {
    main.append(options.status);
  }
  main.append(content);
  shell.append(main);
  return shell;
};

const renderAuthCard = (title, description) => {
  const card = createElement('section', 'card auth-card');
  const heading = createElement('h2', 'card-title', title);
  const text = createElement('p', 'card-description', description);
  card.append(heading, text);
  return card;
};

const renderLogin = state => {
  const card = renderAuthCard('Log in', 'Use your email and password to access your vault dashboard.');
  const form = createElement('form', 'auth-form');
  const emailId = 'login-email';
  const passwordId = 'login-password';

  const emailLabel = createLabel('Email address', emailId);
  const emailInput = createInput(emailId, 'email', 'coach@school.edu', 'email');
  const passwordLabel = createLabel('Password', passwordId);
  const passwordInput = createInput(passwordId, 'password', 'Enter your password', 'current-password');

  const errorMessage = createElement('div', 'form-message');

  const submit = createElement('button', 'primary-button', 'Log in');
  submit.type = 'submit';

  form.append(emailLabel, emailInput, passwordLabel, passwordInput, errorMessage, submit);

  const footer = createElement('div', 'auth-footer');
  footer.innerHTML = `
    <a class="text-link" href="/signup" data-link>Create an account</a>
    <a class="text-link" href="/reset-password" data-link>Forgot password?</a>
  `;

  let loading = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorMessage.textContent = '';
    if (!hasFirebaseConfig) {
      errorMessage.textContent = 'Firebase is not configured yet.';
      return;
    }
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      errorMessage.textContent = 'Enter your email and password.';
      return;
    }
    if (loading) return;
    loading = true;
    submit.disabled = true;
    submit.textContent = 'Logging in...';
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/app');
    } catch (error) {
      errorMessage.textContent = getAuthErrorMessage(error);
    } finally {
      loading = false;
      submit.disabled = false;
      submit.textContent = 'Log in';
    }
  });

  card.append(form, footer);

  const status = renderConfigWarning();
  return withLayout(card, {
    title: 'Welcome back',
    helper: state.loading ? 'Checking your session...' : 'Log in to keep your team data synced.',
    status,
  });
};

const renderSignup = state => {
  const card = renderAuthCard('Create your account', 'Set up email access for Vault Coach Pro.');
  const form = createElement('form', 'auth-form');
  const emailId = 'signup-email';
  const passwordId = 'signup-password';
  const confirmId = 'signup-confirm';

  const emailLabel = createLabel('Email address', emailId);
  const emailInput = createInput(emailId, 'email', 'coach@school.edu', 'email');
  const passwordLabel = createLabel('Password (min 8 characters)', passwordId);
  const passwordInput = createInput(passwordId, 'password', 'Create a password', 'new-password');
  const confirmLabel = createLabel('Confirm password', confirmId);
  const confirmInput = createInput(confirmId, 'password', 'Re-enter password', 'new-password');

  const message = createElement('div', 'form-message');
  const success = createElement('div', 'form-success');

  const submit = createElement('button', 'primary-button', 'Sign up');
  submit.type = 'submit';

  form.append(
    emailLabel,
    emailInput,
    passwordLabel,
    passwordInput,
    confirmLabel,
    confirmInput,
    message,
    success,
    submit
  );

  const footer = createElement('div', 'auth-footer');
  footer.innerHTML = `
    <a class="text-link" href="/login" data-link>Already have an account? Log in</a>
  `;

  let loading = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';
    success.textContent = '';
    if (!hasFirebaseConfig) {
      message.textContent = 'Firebase is not configured yet.';
      return;
    }
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirm = confirmInput.value.trim();
    if (!email || !password || !confirm) {
      message.textContent = 'Complete all fields to continue.';
      return;
    }
    if (password.length < 8) {
      message.textContent = 'Password must be at least 8 characters.';
      return;
    }
    if (password !== confirm) {
      message.textContent = 'Passwords do not match.';
      return;
    }
    if (loading) return;
    loading = true;
    submit.disabled = true;
    submit.textContent = 'Creating account...';
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      success.textContent = 'Account created! Check your email to verify your address.';
      form.reset();
    } catch (error) {
      message.textContent = getAuthErrorMessage(error);
    } finally {
      loading = false;
      submit.disabled = false;
      submit.textContent = 'Sign up';
    }
  });

  card.append(form, footer);

  const status = renderConfigWarning();
  return withLayout(card, {
    title: 'Create account',
    helper: state.loading ? 'Checking your session...' : 'Get started with email + password.',
    status,
  });
};

const renderResetPassword = state => {
  const card = renderAuthCard('Reset password', 'We will send you a password reset link.');
  const form = createElement('form', 'auth-form');
  const emailId = 'reset-email';

  const emailLabel = createLabel('Email address', emailId);
  const emailInput = createInput(emailId, 'email', 'coach@school.edu', 'email');

  const message = createElement('div', 'form-message');
  const success = createElement('div', 'form-success');

  const submit = createElement('button', 'primary-button', 'Send reset link');
  submit.type = 'submit';

  form.append(emailLabel, emailInput, message, success, submit);

  const footer = createElement('div', 'auth-footer');
  footer.innerHTML = `
    <a class="text-link" href="/login" data-link>Back to login</a>
  `;

  let loading = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';
    success.textContent = '';
    if (!hasFirebaseConfig) {
      message.textContent = 'Firebase is not configured yet.';
      return;
    }
    const email = emailInput.value.trim();
    if (!email) {
      message.textContent = 'Enter your email address.';
      return;
    }
    if (loading) return;
    loading = true;
    submit.disabled = true;
    submit.textContent = 'Sending...';
    try {
      await sendPasswordResetEmail(auth, email);
      success.textContent = 'Reset link sent. Check your email.';
      form.reset();
    } catch (error) {
      message.textContent = getAuthErrorMessage(error);
    } finally {
      loading = false;
      submit.disabled = false;
      submit.textContent = 'Send reset link';
    }
  });

  card.append(form, footer);

  const status = renderConfigWarning();
  return withLayout(card, {
    title: 'Reset password',
    helper: state.loading ? 'Checking your session...' : 'We will email you a reset link.',
    status,
  });
};

const renderApp = state => {
  const banner = state.user && !state.user.emailVerified
    ? renderStatusMessage('warning', 'Verify your email to unlock the full experience.')
    : null;
  const card = createElement('section', 'card');
  const heading = createElement('h2', 'card-title', 'App shell');
  const text = createElement(
    'p',
    'card-description',
    'Your training dashboard will live here. We are wiring up athlete tracking, jumps, and team data next.'
  );
  const actions = createElement('div', 'app-actions');
  const signOutButton = createElement('button', 'secondary-button', 'Sign out');
  signOutButton.type = 'button';
  signOutButton.addEventListener('click', async () => {
    if (!auth) return;
    await signOut(auth);
    navigate('/login');
  });
  actions.append(signOutButton);

  card.append(heading, text, actions);
  return withLayout(card, {
    title: 'Vault dashboard',
    helper: 'We are keeping this area ready for upcoming training features.',
    banner,
  });
};

const renderLoading = () => {
  const card = createElement('section', 'card');
  const text = createElement('p', 'card-description', 'Loading your session...');
  card.append(text);
  return withLayout(card, {
    title: 'Loading',
    helper: 'Checking your authentication status.',
  });
};

const routes = {
  '/login': renderLogin,
  '/signup': renderSignup,
  '/reset-password': renderResetPassword,
  '/app': renderApp,
};

const renderProtectedRoute = state => {
  if (state.loading) {
    return renderLoading();
  }
  if (!state.user) {
    navigate('/login');
    return renderLogin(state);
  }
  return renderApp(state);
};

const render = () => {
  if (!app) return;
  const path = getPath();
  const state = { ...authState };
  let screen;

  if (path === '/app') {
    screen = renderProtectedRoute(state);
  } else if (routes[path]) {
    screen = routes[path](state);
  } else {
    navigate('/login');
    screen = renderLogin(state);
  }

  app.innerHTML = '';
  app.append(screen);
};

const getAuthErrorMessage = error => {
  if (!error || !error.code) {
    return 'Something went wrong. Please try again.';
  }
  const code = error.code.replace('auth/', '');
  switch (code) {
    case 'invalid-email':
      return 'Enter a valid email address.';
    case 'user-not-found':
      return 'No account found for that email.';
    case 'wrong-password':
      return 'Incorrect password. Try again.';
    case 'email-already-in-use':
      return 'An account already exists for that email.';
    case 'weak-password':
      return 'Password is too weak. Try at least 8 characters.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

window.addEventListener('popstate', render);
document.addEventListener('click', event => {
  const link = event.target.closest('[data-link]');
  if (!link) return;
  event.preventDefault();
  const href = link.getAttribute('href');
  if (href) {
    navigate(href);
  }
});

subscribeToAuth(render);
initAuthProvider();
