import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ResetPassword.module.css';
import logo from '@/assets/logo.svg';
import arrowBack from '@/assets/arrow-back.svg';
import eyeOn from '@/assets/eye-on-black.svg';
import eyeOff from '@/assets/eye-off-black.svg';

interface PasswordCriteria {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
}

function getPasswordCriteria(pwd: string): PasswordCriteria {
    return {
        minLength: pwd.length >= 8,
        hasUppercase: /[A-Z]/.test(pwd),
        hasNumber: /[0-9]/.test(pwd),
        hasSpecial: /[^A-Za-z0-9]/.test(pwd),
    };
}

function isPasswordValid(criteria: PasswordCriteria): boolean {
    return Object.values(criteria).every(Boolean);
}

const CRITERIA_LABELS: Record<keyof PasswordCriteria, string> = {
    minLength: 'Min. 8 znaków',
    hasUppercase: 'Wielka litera',
    hasNumber: 'Cyfra',
    hasSpecial: 'Znak specjalny',
};

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const token = searchParams.get('token');

    const criteria = getPasswordCriteria(newPassword);
    const passwordValid = isPasswordValid(criteria);
    const metCount = Object.values(criteria).filter(Boolean).length;

    const strengthColor =
        metCount === 4 ? '#14AE5C' :
            metCount === 3 ? '#3B82F6' :
                metCount >= 1 ? '#F59E0B' :
                    'transparent';

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!token) {
            setError('Brak tokenu resetowania hasła.');
            return;
        }

        if (!passwordValid) {
            setError('Hasło musi zawierać min. 8 znaków, wielką literę, cyfrę i znak specjalny.');
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
                body: JSON.stringify({ email, token, newPassword })
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
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        required
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        aria-label={showNewPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                                    >
                                        <img src={showNewPassword ? eyeOff : eyeOn} alt="" width={20} height={20} />
                                    </button>
                                </div>

                                {newPassword.length > 0 && (
                                    <div className={styles.strengthWrapper}>
                                        <div className={styles.strengthBars}>
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={styles.strengthBar}
                                                    style={{
                                                        backgroundColor: metCount >= level ? strengthColor : '#e5e7eb',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className={styles.tooltipWrapper}>
                                            <span className={styles.tooltipIcon}>?</span>
                                            <div className={styles.tooltip}>
                                                {(Object.keys(criteria) as (keyof PasswordCriteria)[]).map((key) => (
                                                    <span
                                                        key={key}
                                                        className={`${styles.criteriaItem} ${criteria[key] ? styles.criteriaMet : styles.criteriaUnmet}`}
                                                    >
                                                        {criteria[key] ? '✓' : '✗'} {CRITERIA_LABELS[key]}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>powtórz nowe hasło</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showRepeatPassword ? 'text' : 'password'}
                                        value={repeatPassword}
                                        onChange={(event) => setRepeatPassword(event.target.value)}
                                        required
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowRepeatPassword((prev) => !prev)}
                                        aria-label={showRepeatPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                                    >
                                        <img src={showRepeatPassword ? eyeOff : eyeOn} alt="" width={20} height={20} />
                                    </button>
                                </div>
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