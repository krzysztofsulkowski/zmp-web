import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import RegisterPage from './app/auth/register/page';
import LoginPage from './app/auth/login/page';
import AuthCallback from './app/auth/callback/page';
import Dashboard from './app/dashboard/page';
import ForgotPasswordPage from './app/auth/forgot-password/page';
import LandingPage from './app/auth/landing/page';
import CommunityPage from './app/community/page';
import FriendsPage from './app/friends/page';
import FriendCollectionsPage from './app/friend-collections/page';
import FaqPage from './app/faq/page';
import AboutPage from './app/about/page';
import ProfilePage from './app/profile/page';
import GamesPage from './app/games/page';
import ProposeGamePage from './app/propose-game/page';
import ResetPasswordPage from './app/auth/reset-password/page';
import AdminPage from './app/admin/page';
import LogPage from './app/log/page';
import AdminGamesPage from './app/admin-games/page';
import UsersPage from './app/users/page';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { clearAuthStorage, getRolesFromToken, isAuthTokenValid } from '@/hooks/authStorage';


import './App.css';

function ProtectedLayout() {
    useIdleTimeout();
    return <Outlet />;
}
function ProtectedRoute() {
    const token = localStorage.getItem('authToken');

    if (!token || !isAuthTokenValid(token)) {
        clearAuthStorage();
        return <Navigate to="/login" replace />;
    }

    const roles = getRolesFromToken(token);

    if (roles.includes('Administrator')) {
        return <Navigate to="/admin" replace />;
    }

    return <ProtectedLayout />;
}

function AdminRoute() {
    const token = localStorage.getItem('authToken');

    if (!token || !isAuthTokenValid(token)) {
        clearAuthStorage();
        return <Navigate to="/login" replace />;
    }

    const roles = getRolesFromToken(token);

    if (!roles.includes('Administrator')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <ProtectedLayout />;
}

function App() {
    return (
        <Router>
            <Routes>

                <Route path="/login" element={<LoginPage />} />

                <Route path="/register" element={<RegisterPage />} />

                <Route path="/auth-callback" element={<AuthCallback />} />

                <Route path="/" element={<LandingPage />} />

                <Route path="/landing" element={<LandingPage />} />

                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/community" element={<CommunityPage />} />

                    <Route path="/friends" element={<FriendsPage />} />

                    <Route path="/friends/:friendId" element={<FriendCollectionsPage />} />

                    <Route path="/faq" element={<FaqPage />} />

                    <Route path="/about" element={<AboutPage />} />

                    <Route path="/profile" element={<ProfilePage />} />

                    <Route path="/games" element={<GamesPage />} />

                    <Route path="/propose-game" element={<ProposeGamePage />} />
                </Route>

                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/log" element={<LogPage />} />
                    <Route path="/admin-games" element={<AdminGamesPage />} />
                    <Route path="/users" element={<UsersPage />} />
                </Route>

            </Routes>
        </Router>
    );
}

export default App;