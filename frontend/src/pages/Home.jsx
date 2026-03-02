import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// ── Inline login/signup form shown on home page when user is not authenticated
function LoginForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // Auth state change in App.jsx will re-render with user
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess('Account created! Please check your email to confirm, then sign in.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-login-card">
            <h2>{isLogin ? 'Sign In to SaigaiOli' : 'Create Your Account'}</h2>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                {isLogin
                    ? 'SaigaiOli: Real-Time Indian Sign Language Recognition and Learning Platform'
                    : 'Join and start learning Indian Sign Language!'}
            </p>

            {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && (
                <div style={{
                    background: 'rgba(39,174,96,0.1)',
                    border: '1px solid rgba(39,174,96,0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.7rem 1rem',
                    color: '#27ae60',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    boxShadow: 'var(--neo-shadow-inset-sm)',
                }}>
                    {success}
                </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="home-email">Email Address</label>
                    <input
                        id="home-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="home-password">Password</label>
                    <input
                        id="home-password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                    {loading
                        ? <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2.5 }}></div>
                        : isLogin ? 'Sign In' : 'Create Account'
                    }
                </button>
            </form>

            <div className="auth-toggle">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </div>
        </div>
    );
}

export default function Home({ user }) {
    return (
        <div className={user ? 'page' : ''} style={!user ? { minHeight: '100vh', background: 'var(--bg-primary)' } : {}}>
            <div className="page-container">

                {/* ─── Hero Section ─────────────────────── */}
                <section className="hero" style={!user ? { paddingTop: '3rem' } : {}}>
                    <div className="hero-badge">
                        🇮🇳 Proudly Celebrating Indian Sign Language
                    </div>

                    <h1>
                        Bridging Silence with<br />
                        <span className="gradient-text">SaigaiOli</span>
                    </h1>

                    <p>
                        SaigaiOli transforms hand gestures into text and speech in real-time.
                        Built to embrace, celebrate, and empower the Indian deaf and mute community -
                        making communication effortless, joyful, and inclusive.
                    </p>

                    {user && (
                        <div className="hero-buttons">
                            <Link to="/capture" className="btn btn-primary btn-lg">
                                Start Recognizing
                            </Link>
                            <Link to="/learn" className="btn btn-secondary btn-lg">
                                Learn ISL Signs
                            </Link>
                        </div>
                    )}

                </section>

                {/* ─── Login Form (only when not authenticated) ─── */}
                {!user && (
                    <div className="home-login-section">
                        <LoginForm />
                    </div>
                )}

                {/* ─── How It Works (only when authenticated) ─── */}
                {user && (
                    <>
                        <section style={{ marginTop: '4rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h2 className="section-title">How It Works</h2>
                                <p className="section-subtitle" style={{ margin: '0 auto' }}>
                                    A simple, fun, and interactive way to communicate using ISL
                                </p>
                            </div>

                            <div className="features-grid">
                                <div className="neo-card feature-card">
                                    <span className="feature-icon">📷</span>
                                    <h3>Show Your Sign</h3>
                                    <p>Hold up your hand in front of the camera and make any ISL alphabet or number sign.</p>
                                </div>
                                <div className="neo-card feature-card">
                                    <span className="feature-icon">🧠</span>
                                    <h3>AI Recognition</h3>
                                    <p>Our deep learning model uses MediaPipe to detect hand landmarks and predict signs instantly.</p>
                                </div>
                                <div className="neo-card feature-card">
                                    <span className="feature-icon">💬</span>
                                    <h3>Text Output</h3>
                                    <p>See the recognized sign appear as text. Build words and sentences character by character.</p>
                                </div>
                                <div className="neo-card feature-card">
                                    <span className="feature-icon">🔊</span>
                                    <h3>Voice Output</h3>
                                    <p>The recognized sign is spoken aloud automatically, bridging the gap between sign and speech.</p>
                                </div>
                            </div>
                        </section>

                        <section className="mission-section">
                            <h2>Our Mission</h2>
                            <p>
                                India has over <strong>18 million</strong> deaf and hearing-impaired individuals, and
                                Indian Sign Language (ISL) is their primary mode of communication. Yet, ISL remains
                                largely unrecognized in mainstream digital platforms.
                            </p>
                            <p style={{ marginTop: '1rem' }}>
                                <strong>SaigaiOli</strong> aims to change this by creating a playful, accessible, and
                                empowering platform that celebrates ISL and its users. Every gesture tells a story -
                                and every sign deserves to be heard.
                            </p>
                            <div className="mission-quote">
                                "When we embrace sign language, we don't just communicate - we connect hearts,
                                bridge worlds, and celebrate the beauty of human expression."
                            </div>
                        </section>

                        <section style={{ textAlign: 'center', margin: '4rem 0 2rem' }}>
                            <h2 className="section-title">Ready to Begin?</h2>
                            <p className="section-subtitle" style={{ margin: '0 auto 1.5rem' }}>
                                Start your ISL journey today — it's fun, interactive, and free!
                            </p>
                            <div className="hero-buttons">
                                <Link to="/capture" className="btn btn-primary btn-lg">
                                    Try Live Capture
                                </Link>
                                <Link to="/learn" className="btn btn-outline btn-lg">
                                    Start Learning
                                </Link>
                            </div>
                        </section>
                    </>
                )}

                <footer style={{
                    textAlign: 'center',
                    padding: '2rem 0',
                    borderTop: '1px solid rgba(41,128,185,0.15)',
                    marginTop: '2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                }}>
                    Made with Love for the Indian Deaf and Mute Community · SaigaiOli © 2026
                </footer>
            </div>
        </div>
    );
}
