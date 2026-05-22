import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRolesFromToken, isAuthTokenValid } from '@/hooks/authStorage';

export default function AuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token && isAuthTokenValid(token)) {
            localStorage.setItem('authToken', token);

            const roles = getRolesFromToken(token);
            const targetPath = roles.includes('Administrator') ? '/admin' : '/dashboard';

            navigate(targetPath);
        } else {
            navigate('/login?error=auth_failed');
        }
    }, [navigate, location]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#0f172a',
            color: 'white',
            flexDirection: 'column'
        }}>
            <h2>Finalizowanie logowania...</h2>
            <p>Proszę czekać, sprawdzamy Twoje uprawnienia.</p>
        </div>
    );
}