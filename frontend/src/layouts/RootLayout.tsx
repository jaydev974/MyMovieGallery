import { Outlet } from 'react-router-dom';
import { usePageMetadata } from '../hooks';

export default function RootLayout() {
  usePageMetadata();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Outlet />
    </div>
  );
}
