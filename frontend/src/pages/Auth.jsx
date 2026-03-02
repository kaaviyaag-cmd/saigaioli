import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
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
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess('Account created! Check your email to confirm, then sign in.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">

                    <h1>{isLogin ? 'Welcome Back!' : 'Join SaigaiOli'}</h1>
                    <p>{isLogin ? 'Sign in to continue your ISL journey' : 'Create your account and start learning ISL'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
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
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
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
        </div>
    );
}
