import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Users.module.css';
import logo from '@/assets/logo.svg';

type UserProfile = {
    avatarUrl: string;
};

export default function AboutPage() {
    const navigate = useNavigate();

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const getAvatarUrl = (url: string) => {
        if (!url) {
            return '';
        }

        if (url.startsWith('http')) {
            return url;
        }

        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const loadUserAvatar = async () => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/authentication/me`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json() as UserProfile;

        setAvatarUrl(getAvatarUrl(data.avatarUrl ?? ''));
    };

    useEffect(() => {
        loadUserAvatar().catch((error) => console.error(error));
    }, []);

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button onClick={() => navigate('/dashboard')}>STRONA GŁÓWNA</button>
                    <button onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
                    <button onClick={() => navigate('/friends')}>ZNAJOMI</button>
                    <button onClick={() => navigate('/faq')}>FAQ</button>
                    <button className={styles.activeNav}>O NAS</button>
                </div>

                <div className={styles.profileWrapper}>
                    <button
                        className={styles.profileButton}
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    >
                        {avatarUrl && <img src={avatarUrl} alt="Avatar użytkownika" />}
                    </button>

                    {isProfileMenuOpen && (
                        <div className={styles.profileMenu}>
                            <button onClick={() => navigate('/profile')}>
                                Ustawienia
                            </button>

                            <button onClick={handleLogout}>
                                Wyloguj się
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <section className={styles.content}>
                <h1>O GameShelf</h1>

                <p className={styles.subtitle}>
                    GameShelf powstał z myślą o graczach, którzy chcą mieć wszystkie swoje gry
                    w jednym miejscu. Niezależnie od platformy możesz tworzyć własne kolekcje,
                    organizować bibliotekę i wracać do ulubionych tytułów bez chaosu.
                </p>

                <div className={styles.aboutBox}>
                    <article className={styles.aboutCard}>
                        <h2>Nasza wizja</h2>

                        <p>
                            Chcemy stworzyć wygodne miejsce do organizowania gier i dzielenia się
                            nimi ze znajomymi. GameShelf łączy prostotę, nowoczesny wygląd i funkcje,
                            które pomagają utrzymać porządek w bibliotece.
                        </p>
                    </article>

                    <article className={styles.aboutCard}>
                        <h2>Dostępność wszędzie</h2>

                        <p>
                            Aplikacja działa na różnych urządzeniach — w przeglądarce, na desktopie
                            i telefonie. Dzięki temu możesz mieć dostęp do swojej kolekcji zawsze,
                            kiedy tego potrzebujesz.
                        </p>
                    </article>

                    <article className={styles.aboutCard}>
                        <h2>Dla graczy</h2>

                        <p>
                            GameShelf został zaprojektowany z myślą o osobach, które grają regularnie
                            i chcą lepiej zarządzać swoimi tytułami, planami zakupowymi oraz ulubionymi
                            seriami.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    );
}