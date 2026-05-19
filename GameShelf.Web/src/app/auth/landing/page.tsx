import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import styles from './Landing.module.css';
import logo from '@/assets/logo.svg';
import offer from '@/assets/offer.svg';
import mockups from '@/assets/mockups.svg';

export default function LandingPage() {
    const navigate = useNavigate();

    const commandRef = useRef<HTMLElement | null>(null);
    const [isCommandVisible, setIsCommandVisible] = useState(false);
    const offerRef = useRef<HTMLDivElement | null>(null);
    const [isOfferVisible, setIsOfferVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target === commandRef.current && entry.isIntersecting) {
                        setIsCommandVisible(true);
                    }

                    if (entry.target === offerRef.current && entry.isIntersecting) {
                        setIsOfferVisible(true);
                    }
                });
            },
            {
                threshold: 0.85,
                rootMargin: '0px'
            }
        );

        if (commandRef.current) {
            observer.observe(commandRef.current);
        }

        if (offerRef.current) {
            observer.observe(offerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <main className={styles.page}>
            <div className={styles.navbar}>
                <div className={styles.logo}>
                    <img src={logo} alt="logo" />
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
            <div
                ref={offerRef}
                className={`${styles.offer} ${isOfferVisible ? styles.offerVisible : ''}`}
            >
                <img src={offer} alt="offer" />
            </div>

            <section
                ref={commandRef}
                className={`${styles.commandCenter} ${isCommandVisible ? styles.commandVisible : ''}`}
            >
                <div className={styles.commandText}>
                    <h2>Twoje centrum dowodzenia grami</h2>
                    <p>
                        Pełna kontrola nad biblioteką, statystyki i odkrywanie nowych tytułów — wszystko w jednym, dopracowanym miejscu.
                    </p>
                </div>
            </section>

            <section className={styles.features}>
                <h2 className={styles.featuresTitle}>Co oferujemy?</h2>

                <div className={styles.featureCards}>
                    <div className={styles.featureCard}>
                        <h3>Organizuj swoją bibliotekę</h3>
                        <div className={styles.cardLine}></div>
                        <p>
                            Wyszukaj gry po tytule, kategorii lub platformie - a następnie dodaj ją do jednej z gotowych kolekcji, lub stwórz nową! Oceniaj, porządkuj i pokazuj innym, w co grasz.
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <h3>Śledź statystyki</h3>
                        <div className={styles.cardLine}></div>
                        <p>
                            Zyskaj pełny wgląd w swoją bibliotekę. Dane i podsumowania, które pomagają lepiej zrozumieć, jak i w co grasz.
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <h3>Sprawdź w co grają pozostali gracze</h3>
                        <div className={styles.cardLine}></div>
                        <p>
                            Śledź, co pojawia się u innych, przeglądaj ich kolekcje i dziel się swoimi ostatnimi odkryciami.
                        </p>
                    </div>
                </div>

                <div className={styles.devicesCard}>
                    <div className={styles.devicesText}>
                        <h3>Pełna kontrola na każdym urządzeniu</h3>
                        <div className={styles.deviceLine}></div>
                        <p>
                            Korzystaj z aplikacji na desktopie i telefonie, gdzie znajdziesz dodatkowe funkcje oraz jeszcze wygodniejsze zarządzanie swoją biblioteką gier. Desktop oferuje pełne centrum zarządzania kolekcją, a wersja mobilna umożliwia szybki dostęp do najważniejszych informacji i kontakt z innymi graczami w dowolnym miejscu.
                        </p>

                        <div className={styles.downloadButtons}>
                            <button className={styles.downloadButton}>pobierz na Windows</button>
                            <button className={styles.downloadButton}>pobierz na Google Play</button>
                        </div>
                    </div>

                    <img className={styles.mockups} src={mockups} alt="Widok aplikacji na różnych urządzeniach" />
                </div>
            </section>
        </main>
    );
}