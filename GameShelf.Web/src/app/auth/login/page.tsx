import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styles from "./Login.module.css";
import logo from "@/assets/logo.svg";
import eyeOn from "@/assets/eye-on-black.svg";
import eyeOff from "@/assets/eye-off-black.svg";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);

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

            if (!response.ok) {
                throw new Error('Nieprawidłowy adres e-mail lub hasło.');
            }

            const token = data?.data?.token || data?.token;

            if (!token) {
                throw new Error('Nieprawidłowy adres e-mail lub hasło.');
            }

            localStorage.setItem('authToken', token);

            setError(null);
            setSuccessMessage('Zalogowano pomyślnie!');

            const payloadBase64 = token.split('.')[1];

            const payloadJson = atob(
                payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
            );

            const payload = JSON.parse(payloadJson) as Record<string, unknown>;

            const role =
                payload.role ??
                payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

            const roles = Array.isArray(role) ? role : [role];

            const targetPath = roles.includes('Administrator')
                ? '/admin'
                : '/dashboard';

            setTimeout(() => navigate(targetPath), 1000);

        } catch (err: any) {
            setError(err.message || 'Błąd logowania');
            setSuccessMessage(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
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
                                        <img
                                            src={showPassword ? eyeOff : eyeOn}
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                    </button>
                                </div>
                                <div className={styles.forgotWrapper}>
                                    <Link to="/forgot-password" className={styles.forgotLink}>
                                        Nie pamiętam hasła
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.primaryButton}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logowanie...' : 'Zaloguj się'}
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

                        <p className={styles.bottomText}>
                            Nie masz konta? <Link to="/register" className={styles.linkStrong}>Zarejestruj się</Link>
                        </p>
                    </div>
                </section>

            </div>
        </main>
    );
}