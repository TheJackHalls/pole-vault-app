(() => {
  const app = document.getElementById('app');

  const routes = {
    '/app': {
      label: 'App',
      title: 'Vault Coach Pro',
      description: 'Your training dashboard will live here. This is the app shell placeholder while features come online.',
      actions: [
        { label: 'Explore the shell', hint: 'Navigation, layout, and spacing are ready.' },
        { label: 'Jump to Login', hint: 'Placeholder auth screen.' },
      ],
    },
    '/login': {
      label: 'Login',
      title: 'Welcome back',
      description: 'Sign-in will live here soon. For now this is a placeholder screen with the same shell layout.',
      actions: [
        { label: 'Email / password coming soon', hint: 'No auth logic wired yet.' },
        { label: 'Continue to App', hint: 'See the app shell preview.' },
      ],
    },
  };

  const navOrder = ['/app', '/login'];

  const getPath = () => {
    let path = window.location.pathname || '/app';
    if (path.endsWith('/index.html')) {
      path = path.replace('/index.html', '') || '/app';
    }
    if (path === '/') {
      return '/app';
    }
    return path;
  };

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const navigate = path => {
    if (!routes[path]) return;
    if (getPath() === path) return;
    window.history.pushState({}, '', path);
    render();
  };

  const renderHeader = () => {
    const header = createElement('header', 'top-header');
    const wordmark = createElement('div', 'wordmark', 'TAYKOF');
    const subtitle = createElement('div', 'shell-subtitle', 'Vault Coach Pro');
    header.append(wordmark, subtitle);
    return header;
  };

  const renderHero = route => {
    const hero = createElement('section', 'shell-hero card');
    const title = createElement('h1', 'shell-title', routes[route].title);
    const description = createElement('p', 'shell-description', routes[route].description);
    hero.append(title, description);
    return hero;
  };

  const renderActions = route => {
    const wrapper = createElement('section', 'shell-actions');
    const list = createElement('div', 'shell-action-list');

    routes[route].actions.forEach((action, index) => {
      const card = createElement('button', 'shell-action card');
      card.type = 'button';
      const label = createElement('span', 'shell-action-label', action.label);
      const hint = createElement('span', 'shell-action-hint', action.hint);
      card.append(label, hint);

      if (route === '/app' && index === 1) {
        card.addEventListener('click', () => navigate('/login'));
      }
      if (route === '/login' && index === 1) {
        card.addEventListener('click', () => navigate('/app'));
      }

      list.append(card);
    });

    const helper = createElement(
      'p',
      'shell-note',
      'Mobile-first spacing, tap targets, and layout scaffolding are in place. UI features will land in later slices.'
    );

    wrapper.append(list, helper);
    return wrapper;
  };

  const renderNav = route => {
    const nav = createElement('nav', 'bottom-nav');
    nav.setAttribute('aria-label', 'Primary');

    navOrder.forEach(path => {
      const button = createElement('button', 'nav-button', routes[path].label);
      button.type = 'button';
      if (route === path) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'page');
      }
      button.addEventListener('click', () => navigate(path));
      nav.append(button);
    });

    return nav;
  };

  const render = () => {
    if (!app) return;
    app.innerHTML = '';
    const route = routes[getPath()] ? getPath() : '/app';
    if (route !== getPath()) {
      window.history.replaceState({}, '', route);
    }

    const shell = createElement('div', 'app-shell');
    const main = createElement('main', 'screen');

    main.append(renderHeader(), renderHero(route), renderActions(route));
    shell.append(main, renderNav(route));

    app.append(shell);
  };

  window.addEventListener('popstate', render);
  render();
})();
