import { useState } from 'react';
import type { FormEvent } from 'react'; 
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const apiUrl = import.meta.env.VITE_API_URL; 

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch(`${apiUrl}/api/authentication/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });

            if (!res.ok) throw new Error("Rejestracja nieudana. Sprawdź dane.");

            alert("Konto utworzone!");
            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', color: 'white', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px' }}>
            <h1>Rejestracja</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit" style={{ backgroundColor: '#6366f1', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Zarejestruj się
                </button>
            </form>
            {error && <p style={{ color: '#fb7185' }}>{error}</p>}
            <p>Masz konto? <Link to="/login" style={{ color: '#6366f1' }}>Zaloguj się</Link></p>
        </div>
    );
}