import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ user }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getInitial = () => {
        if (!user?.email) return '?';
        return user.email[0].toUpperCase();
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                SaigaiOli
            </div>

            <ul className="navbar-links">
                <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
                <li><NavLink to="/capture" className={({ isActive }) => isActive ? 'active' : ''}>Capture</NavLink></li>
                <li><NavLink to="/learn" className={({ isActive }) => isActive ? 'active' : ''}>Learn ISL</NavLink></li>
                <li><NavLink to="/feedback" className={({ isActive }) => isActive ? 'active' : ''}>Feedback</NavLink></li>
            </ul>

            <div className="navbar-actions">
                <div className="navbar-user">
                    <div className="user-avatar">{getInitial()}</div>
                    <span>{user?.email?.split('@')[0]}</span>
                </div>
                <button className="btn btn-logout" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}
