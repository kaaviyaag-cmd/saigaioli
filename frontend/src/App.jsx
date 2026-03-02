import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Capture from './pages/Capture';
import Learn from './pages/Learn';
import Feedback from './pages/Feedback';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner" style={{ width: 52, height: 52 }}></div>
      </div>
    );
  }

  return (
    <Router>
      {/* Navbar only shown for logged-in users */}
      {user && <Navbar user={user} />}
      <Routes>
        {/* Home is PUBLIC — shows landing + login form if not authenticated */}
        <Route path="/" element={<Home user={user} />} />

        {/* Protected pages */}
        <Route
          path="/capture"
          element={user ? <Capture /> : <Navigate to="/" replace />}
        />
        <Route
          path="/learn"
          element={user ? <Learn /> : <Navigate to="/" replace />}
        />
        <Route
          path="/feedback"
          element={user ? <Feedback user={user} /> : <Navigate to="/" replace />}
        />

        {/* Legacy /login route — redirect to home */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
