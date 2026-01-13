import React from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const PageLayout = ({ title, description, children, footer }: PageLayoutProps) => (
  <div className="app-shell">
    <header className="app-header">
      <div>
        <div className="wordmark">TAYKOF</div>
        <div className="subtitle">Vault Coach Pro</div>
      </div>
      <h1>{title}</h1>
      {description ? <p className="helper-text">{description}</p> : null}
    </header>
    <main className="app-content">{children}</main>
    {footer ? <footer className="app-footer">{footer}</footer> : null}
  </div>
);

export default PageLayout;
