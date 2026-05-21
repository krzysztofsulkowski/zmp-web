import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ResetPassword.module.css';
import logo from '@/assets/logo.svg';
import arrowBack from '@/assets/arrow-back.svg';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const token = searchParams.get('token');

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!token) {
            setError('Brak tokenu resetowania hasła.');
            return;
        }

        if (newPassword !== repeatPassword) {
            setError('Hasła nie są takie same.');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/authentication/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    token,
                    newPassword
                })
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error('Nie udało się zmienić hasła. Sprawdź poprawność danych.');
            }

            setSuccessMessage('Hasło zostało zmienione. Możesz się teraz zalogować.');
            setEmail('');
            setNewPassword('');
            setRepeatPassword('');

            setTimeout(() => navigate('/login'), 2000);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Wystąpił nieoczekiwany błąd.');
            }
        }
    };

    return (
        <main className={styles.page}>
            {error && <p className={styles.errorMessage}>{error}</p>}
            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

            <div className={styles.container}>
                <section className={styles.leftPanel}>
                    <div className={styles.logoWrapper}>
                        <img src={logo} alt="logo" className={styles.logoImage} />

                        <h2 className={styles.logoSubtitle}>
                            Ustaw nowe hasło
                        </h2>

                        <p className={styles.description}>
                            Wprowadź adres e-mail przypisany do konta oraz nowe hasło, którego chcesz używać przy kolejnym logowaniu.
                        </p>
                    </div>
                </section>

                <section className={styles.rightPanel}>
                    <div className={styles.card}>
                        <button className={styles.backButton} onClick={() => navigate('/login')}>
                            <img src={arrowBack} alt="back" />
                        </button>

                        <h1 className={styles.title}>Nowe hasło</h1>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label className={styles.label}>adres e-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>nowe hasło</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>powtórz nowe hasło</label>
                                <input
                                    type="password"
                                    value={repeatPassword}
                                    onChange={(event) => setRepeatPassword(event.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <p className={styles.bottomText}>
                                Po zapisaniu nowego hasła wrócisz do ekranu logowania.
                            </p>

                            <button type="submit" className={styles.primaryButton}>
                                Zmień hasło
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
}