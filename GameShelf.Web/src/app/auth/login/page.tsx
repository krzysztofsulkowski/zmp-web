import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styles from "./Login.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const externalAuthError = searchParams.get('error');
        if (externalAuthError === 'auth_failed') {
            setError('Logowanie za pomocą zewnętrznego dostawcy nie powiodło się.');
        }
    }, [searchParams]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/authentication/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.description || data.message || 'Logowanie nie powiodło się');
            }

            if (data.data?.token || data.token) {
                const token = data.data?.token || data.token;
                localStorage.setItem('authToken', token);
                setSuccessMessage("Zalogowano pomyślnie!");
                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                throw new Error("Brak tokenu w odpowiedzi serwera.");
            }

        } catch (err: any) {
            setError(err.message || 'Wystąpił nieznany błąd');
        }
    };

    const handleGoogleLogin = () => {
        const returnUrl = encodeURIComponent(window.location.origin + "/auth-callback");
        window.location.href = `${apiUrl}/api/authentication/external-login?provider=Google&returnUrl=${returnUrl}`;
    };

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <section className={styles.leftPanel}>
                    <div className={styles.logoWrapper}>
                        <img src="/logo.svg" alt="Logo" className={styles.logoImage} />
                        <div className={styles.logoSubtitle}>Twoja biblioteka gier w jednym miejscu</div>
                    </div>
                </section>

                <section className={styles.rightPanel}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Logowanie</h1>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Hasło</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <button type="submit" className={styles.primaryButton}>Zaloguj się</button>

                            <div className={styles.divider}>
                                <span className={styles.dividerText}>lub</span>
                            </div>

                            <button
                                type="button"
                                className={styles.socialButtonGoogle}
                                onClick={handleGoogleLogin}
                            >
                                Zaloguj się przez Google
                            </button>
                        </form>

                        {error && <p className={styles.errorMessage}>{error}</p>}
                        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

                        <p className={styles.bottomText}>
                            Nie posiadasz konta? <Link to="/register" className={styles.linkStrong}>Zarejestruj się</Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}