import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (token) {
            localStorage.setItem('authToken', token);
            console.log("Token Google zapisany pomyślnie");
            navigate('/dashboard');
        } else {
            console.error("Błąd autoryzacji zewnętrznej:", error);
            console.error("Błąd autoryzacji zewnętrznej:", error);
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