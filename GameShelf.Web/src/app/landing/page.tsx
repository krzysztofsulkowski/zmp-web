import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './Landing.module.css';
import logo from '@/assets/logo.svg';
import offer from '@/assets/offer.svg';

export default function LandingPage() {
    const navigate = useNavigate();


    return (
        <main className={styles.page}>
            <div className={styles.navbar}>
                <div className={styles.logo}>
                    <img src={logo} alt="logo" />
                </div>

                <div className={styles.navLinks}>
                    <span>STRONA GŁÓWNA</span>
                    <span>FAQ</span>
                    <span>O NAS</span>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.login}
                        onClick={() => navigate('/login')}
                    >
                        LOGOWANIE
                    </button>

                    <button
                        className={styles.register}
                        onClick={() => navigate('/register')}
                    >
                        REJESTRACJA
                    </button>
                </div>
            </div>

            <div className={styles.hero}>
                <h1 className={styles.title}>
                    Twoje gry w jednym miejscu. I ludzie, którzy grają w to samo.
                </h1>

                <p className={styles.description}>
                    Uporządkuj gry z różnych platform i sprawdzaj, w co grają Twoi znajomi - w jednym miejscu, bez przełączania między aplikacjami.
                </p>

                <button
                    className={styles.cta}
                    onClick={() => navigate('/register')}
                >
                    DOŁĄCZ DO NAS!
                </button>

                <p className={styles.subtext}>
                    Zarejestruj się za darmo i rozpocznij tworzenie kolekcji!
                </p>
            </div>

            <div className={styles.offer}>
                <img src={offer} alt="offer" />
            </div>
        </main>
    );
}