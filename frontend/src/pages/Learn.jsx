import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Learn() {
    const [signs, setSigns] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    // Track which signs had image-load errors
    const [imgErrors, setImgErrors] = useState({});

    useEffect(() => {
        fetchSigns();
    }, []);

    const fetchSigns = async () => {
        try {
            const res = await fetch(`${API_URL}/signs`);
            const data = await res.json();
            setSigns(data.signs || []);
        } catch (err) {
            console.error('Error fetching signs:', err);
            // Fallback: show A-Z + 0-9 locally
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const numbers = '0123456789'.split('');
            setSigns([...alphabet, ...numbers]);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleImgError = (sign) => {
        setImgErrors(prev => ({ ...prev, [sign]: true }));
    };

    const filteredSigns = signs.filter((s) => {
        if (filter === 'alpha') return isNaN(s);
        if (filter === 'num') return !isNaN(s);
        return true;
    });

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-container">
                <div className="learn-header">
                    <h1 className="section-title">Learn ISL Signs</h1>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Explore Indian Sign Language alphabets and numbers. Click any card to hear it spoken! 🔊
                    </p>

                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Signs ({signs.length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'alpha' ? 'active' : ''}`}
                            onClick={() => setFilter('alpha')}
                        >
                            Alphabets (A–Z)
                        </button>
                        <button
                            className={`filter-tab ${filter === 'num' ? 'active' : ''}`}
                            onClick={() => setFilter('num')}
                        >
                            Numbers (0–9)
                        </button>
                    </div>
                </div>

                <div className="signs-grid">
                    {filteredSigns.map((sign, index) => (
                        <div
                            key={sign}
                            className="neo-card sign-card"
                            onClick={() => speak(isNaN(sign) ? sign : `Number ${sign}`)}
                            style={{ animationDelay: `${index * 0.025}s` }}
                        >
                            {imgErrors[sign] ? (
                                /* ── Image failed to load: show letter placeholder ── */
                                <div className="sign-card-placeholder">{sign}</div>
                            ) : (
                                <img
                                    className="sign-card-image"
                                    src={`${API_URL}/isl-images/${sign}`}
                                    alt={`ISL sign for ${sign}`}
                                    loading="lazy"
                                    onError={() => handleImgError(sign)}
                                />
                            )}
                            <div className="sign-card-label">{sign}</div>
                            <button
                                className="sign-card-speak"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    speak(isNaN(sign) ? sign : `Number ${sign}`);
                                }}
                                title={`Speak ${sign}`}
                            >
                                🔊
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
