import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Feedback({ user }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [experience, setExperience] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating before submitting.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('feedback')
                .insert([{ user_id: user?.id, rating, experience, suggestions }]);

            if (insertError) throw insertError;
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="page">
                <div className="page-container">
                    <div className="feedback-layout">
                        <div className="neo-card feedback-success">
                            <span className="success-icon">🎉</span>
                            <h2>Thank You!</h2>
                            <p>Your feedback helps us improve ISL Connect for everyone.</p>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '1.5rem' }}
                                onClick={() => {
                                    setSubmitted(false);
                                    setRating(0);
                                    setExperience('');
                                    setSuggestions('');
                                }}
                            >
                                Submit Another
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-container">
                <div className="feedback-layout">
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h1 className="section-title">Share Your Feedback</h1>
                        <p className="section-subtitle" style={{ margin: '0 auto' }}>
                            Help us make ISL Connect better! Your thoughts matter 💛
                        </p>
                    </div>

                    <div className="neo-card feedback-card">
                        {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Star Rating */}
                            <div className="form-group" style={{ alignItems: 'center' }}>
                                <label>How would you rate your experience?</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                                {rating > 0 && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                                    </span>
                                )}
                            </div>

                            {/* Experience */}
                            <div className="form-group">
                                <label htmlFor="experience">Tell us about your experience</label>
                                <textarea
                                    id="experience"
                                    value={experience}
                                    onChange={e => setExperience(e.target.value)}
                                    placeholder="What did you enjoy? What worked well for you?"
                                    required
                                />
                            </div>

                            {/* Suggestions */}
                            <div className="form-group">
                                <label htmlFor="suggestions">Suggestions for improvement</label>
                                <textarea
                                    id="suggestions"
                                    value={suggestions}
                                    onChange={e => setSuggestions(e.target.value)}
                                    placeholder="Any features you'd like to see? Ways we can improve?"
                                />
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading
                                    ? <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2.5 }}></div>
                                    : '✨ Submit Feedback'
                                }
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
