import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './ForgotPassword.module.css';
import logo from '@/assets/logo.svg';
import arrowBack from "@/assets/arrow-back.svg";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const apiUrl = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`${apiUrl}/api/authentication/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                throw new Error('Nie udało się rozpocząć resetu hasła.');
            }

            setSuccessMessage('Jeśli konto z podanym adresem istnieje, wysłaliśmy wiadomość z instrukcją resetu hasła.');
            setEmail('');
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
            <div className={styles.container}>
                <section className={styles.leftPanel}>
                    <div className={styles.logoWrapper}>
                        <img src={logo} alt="logo" className={styles.logoImage} />

                        <h2 className={styles.logoSubtitle}>
                            Odzyskaj dostęp do swojego konta
                        </h2>

                        <p className={styles.description}>
                            Wpisz adres e-mail przypisany do konta, a wyślemy Ci link do ustawienia nowego hasła.
                        </p>
                    </div>
                </section>

                <section className={styles.rightPanel}>
                    <div className={styles.card}>
                        <button className={styles.backButton} onClick={() => navigate(-1)}>
                            <img src={arrowBack} alt="back" />
                        </button>

                        <h1 className={styles.title}>Reset hasła</h1>

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
                            <p className={styles.bottomText}>
                                Na Twój adres e-mail wyślemy link, który umożliwi Ci zmianę hasła.
                            </p>
                            <button type="submit" className={styles.primaryButton}>
                                Wyślij link
                            </button>
                        </form>

                        {error && <p className={styles.errorMessage}>{error}</p>}
                        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

                    </div>
                </section>
            </div>
        </main>
    );
}