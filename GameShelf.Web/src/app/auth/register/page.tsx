import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from "./Register.module.css";
import logo from "@/assets/logo.svg";

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (password !== confirmPassword) {
            setError("Hasła nie są takie same");
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/api/authentication/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.description || data.message || 'Rejestracja nieudana. Sprawdź dane.');
            }

            setSuccessMessage('Konto zostało utworzone.');
            setTimeout(() => navigate('/login'), 1000);
        } catch (err: any) {
            setError(err.message || 'Wystąpił błąd rejestracji.');
        }
    };

    const handleGoogleRegister = () => {
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
                        <h1 className={styles.title}>Rejestracja</h1>

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
                                <label className={styles.label}>nazwa użytkownika</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
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
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>powtórz hasło</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <button type="submit" className={styles.primaryButton}>
                                Zarejestruj się
                            </button>

                            <div className={styles.divider}>lub</div>

                            <button
                                type="button"
                                className={styles.socialButtonGoogle}
                                onClick={handleGoogleRegister}
                            >
                                Kontynuuj przez Google
                            </button>
                        </form>

                        {error && <p className={styles.errorMessage}>{error}</p>}
                        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

                        <p className={styles.bottomText}>
                            Masz już konto? <Link to="/login" className={styles.linkStrong}>Zaloguj się</Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}