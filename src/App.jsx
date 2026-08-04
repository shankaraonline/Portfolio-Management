import React, { useState, useEffect } from 'react';
import Portfolio from './pages/Portfolio';
import Admin from './pages/Admin';

export default function App() {
  const [view, setView] = useState(() =>
    window.location.hash === '#admin' ? 'admin' : 'portfolio'
  );

  useEffect(() => {
    const onChange = () => {
      setView(window.location.hash === '#admin' ? 'admin' : 'portfolio');
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return view === 'admin' ? <Admin /> : <Portfolio />;
}
