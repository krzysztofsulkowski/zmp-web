import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from "./Register.module.css";
import logo from "@/assets/logo.svg";
import eyeOn from "@/assets/eye-on-black.svg";
import eyeOff from "@/assets/eye-off-black.svg";

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

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const criteria = getPasswordCriteria(password);
    const passwordValid = isPasswordValid(criteria);
    const metCount = Object.values(criteria).filter(Boolean).length;

    const strengthColor =
        metCount === 4 ? '#14AE5C' :
            metCount === 3 ? '#3B82F6' :
                metCount >= 1 ? '#F59E0B' :
                    'transparent';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!passwordValid) {
            setError("Hasło musi zawierać min. 8 znaków, wielką literę, cyfrę i znak specjalny.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Hasła nie są takie same.");
            return;
        }

        if (!email.includes("@")) {
            setError("Niepoprawny adres e-mail.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${apiUrl}/api/authentication/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });

            if (!res.ok) {
                throw new Error('Rejestracja nieudana. Sprawdź poprawność danych.');
            }

            setError(null);
            setSuccessMessage('Konto zostało utworzone.');

            setTimeout(() => {
                navigate('/login');
            }, 1000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd rejestracji.');
            setSuccessMessage(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = () => {
        const returnUrl = encodeURIComponent(window.location.origin + "/auth-callback");
        window.location.href = `${apiUrl}/api/authentication/external-login?provider=Google&returnUrl=${returnUrl}`;
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
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                                    >
                                        <img src={showPassword ? eyeOff : eyeOn} alt="" width={20} height={20} />
                                    </button>
                                </div>

                                {password.length > 0 && (
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
                                <label className={styles.label}>powtórz hasło</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                                    >
                                        <img src={showConfirmPassword ? eyeOff : eyeOn} alt="" width={20} height={20} />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.primaryButton}
                                disabled={isLoading}
                            >
                                {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
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

                        <p className={styles.bottomText}>
                            Masz już konto? <Link to="/login" className={styles.linkStrong}>Zaloguj się</Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}