import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import RegisterPage from './app/auth/register/page';
import LoginPage from './app/auth/login/page';
import AuthCallback from './app/auth/callback/page';
import Dashboard from './app/dashboard/page';
import ForgotPasswordPage from './app/auth/forgot-password/page';
import LandingPage from './app/auth/landing/page';
import CommunityPage from './app/community/page';
import FriendsPage from './app/friends/page';
import FaqPage from './app/faq/page';
import AboutPage from './app/about/page';
import ProfilePage from './app/profile/page';
import GamesPage from './app/games/page';
import ResetPasswordPage from './app/auth/reset-password/page';

import './App.css';

function ProtectedRoute() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
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

                    <Route path="/profile" element={<ProfilePage />} />

                    <Route path="/games" element={<GamesPage />} />

                    <Route path="/faq" element={<FaqPage />} />

                    <Route path="/about" element={<AboutPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;