import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  helper?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AppShell = ({ title, helper, children, footer }: AppShellProps) => {
  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="wordmark">TAYKOF</div>
        <div className="shell-subtitle">Vault Coach Pro</div>
        <h1 className="screen-title">{title}</h1>
        {helper ? <p className="screen-helper">{helper}</p> : null}
      </header>
      <main className="screen">{children}</main>
      {footer ? <footer className="screen-footer">{footer}</footer> : null}
    </div>
  );
};
