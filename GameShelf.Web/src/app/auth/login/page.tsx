import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styles from "./Login.module.css";
import styles from "./Landing.module.css";
import logo from "@/assets/logo.svg";
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
            setError('Logowanie za pomocą Google nie powiodło się.');
        }
    }, [searchParams]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`${apiUrl}/api/authentication/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            console.log("LOGIN RESPONSE:", data);

            if (!response.ok) {
                if (data?.errors) {
                    const messages = Object.values(data.errors).flat().join(" ");
                    throw new Error(messages);
                }

                throw new Error(data?.title || data?.message || 'Logowanie nie powiodło się');
            }

            const token = data?.data?.token || data?.token;

            if (!token) {
                throw new Error("Brak tokenu");
            }

            localStorage.setItem('authToken', token);

            setError(null);
            setSuccessMessage("Zalogowano pomyślnie!");

            setTimeout(() => navigate('/dashboard'), 1000);

        } catch (err: any) {
            setError(err.message || 'Błąd logowania');
            setSuccessMessage(null);
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
                        <img src={logo} alt="logo" className={styles.logoImage} />

                        <h2 className={styles.logoSubtitle}>
                            Pełna kontrola na każdym urządzeniu
                        </h2>

                        <p className={styles.description}>
                            Korzystaj z aplikacji na desktopie i telefonie, zarządzaj swoją biblioteką gier,
                            śledź postępy i kontaktuj się z innymi graczami w jednym miejscu.
                        </p>

                        <div className={styles.downloadButtons}>
                            <button className={styles.downloadBtn}>Pobierz na Windows</button>
                            <button className={styles.downloadBtn}>Pobierz na Google Play</button>
                        </div>
                    </div>
                </section>

                <section className={styles.rightPanel}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Logowanie</h1>

                        <form onSubmit={handleSubmit} className={styles.form}>

                            <div className={styles.field}>
                                <label className={styles.label}>adres e-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>hasło</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                                <div className={styles.forgotWrapper}>
                                    <Link to="/forgot-password" className={styles.forgotLink}>
                                        Nie pamiętam hasła
                                    </Link>
                                </div>

                            </div>

                            <button type="submit" className={styles.primaryButton}>
                                Zaloguj się
                            </button>

                            <div className={styles.divider}>lub</div>

                            <button
                                type="button"
                                className={styles.socialButtonGoogle}
                                onClick={handleGoogleLogin}
                            >
                                Kontynuuj przez Google
                            </button>
                        </form>

                        {error && <p className={styles.errorMessage}>{error}</p>}
                        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

                        <p className={styles.bottomText}>
                            Nie masz konta? <Link to="/register" className={styles.linkStrong}>Zarejestruj się</Link>
                        </p>
                    </div>
                </section>

            </div>
        </main>
    );
}