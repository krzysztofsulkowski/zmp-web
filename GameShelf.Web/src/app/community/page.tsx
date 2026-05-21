import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Community.module.css';
import logo from '@/assets/logo.svg';

type UserProfile = {
    avatarUrl: string;
};

type StatisticItem = {
    label: string;
    value: number;
};

type GlobalStatistics = {
    totalUsers: number;
    totalGamesInLibrary: number;
    totalUserGames: number;
    mostPopularGames: StatisticItem[];
    popularPlatforms: StatisticItem[];
    popularGenres: StatisticItem[];
    highestRatedGames: StatisticItem[];
};

export default function CommunityPage() {
    const navigate = useNavigate();

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [statistics, setStatistics] = useState<GlobalStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

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

    const loadStatistics = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');

            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/statistics/global`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać statystyk.');
            }

            const data = await response.json() as GlobalStatistics;

            setStatistics(data);
        } catch (error) {
            console.error(error);
            setErrorMessage('Nie udało się pobrać statystyk społeczności.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUserAvatar().catch((error) => console.error(error));
        loadStatistics().catch((error) => console.error(error));
    }, []);

    const renderList = (title: string, items: StatisticItem[], emptyText: string) => {
        return (
            <article className={styles.statCard}>
                <h2>{title}</h2>

                {items.length > 0 ? (
                    <div className={styles.rankingList}>
                        {items.map((item, index) => (
                            <div className={styles.rankingItem} key={`${item.label}-${index}`}>
                                <div>
                                    <span className={styles.position}>{index + 1}</span>
                                    <span>{item.label}</span>
                                </div>

                                <strong>{item.value}</strong>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.emptyText}>{emptyText}</p>
                )}
            </article>
        );
    };

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button onClick={() => navigate('/dashboard')}>STRONA GŁÓWNA</button>
                    <button className={styles.activeNav}>SPOŁECZNOŚĆ</button>
                    <button onClick={() => navigate('/friends')}>ZNAJOMI</button>
                    <button onClick={() => navigate('/faq')}>FAQ</button>
                    <button onClick={() => navigate('/about')}>O NAS</button>
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
                <h1>Społeczność GameShelf</h1>

                <p className={styles.subtitle}>
                    Zobacz globalne statystyki aplikacji, najpopularniejsze gry, platformy i gatunki wybierane przez użytkowników.
                </p>

                {isLoading && (
                    <p className={styles.status}>Ładowanie statystyk...</p>
                )}

                {!isLoading && errorMessage && (
                    <p className={styles.status}>{errorMessage}</p>
                )}

                {!isLoading && statistics && (
                    <>
                        <div className={styles.summaryGrid}>
                            <article className={styles.summaryCard}>
                                <span>Użytkownicy</span>
                                <strong>{statistics.totalUsers}</strong>
                            </article>

                            <article className={styles.summaryCard}>
                                <span>Gry dostępne w systemie</span>
                                <strong>{statistics.totalGamesInLibrary}</strong>
                            </article>

                            <article className={styles.summaryCard}>
                                <span>Gry dodane do kolekcji przez wszystkich graczy</span>
                                <strong>{statistics.totalUserGames}</strong>
                            </article>
                        </div>

                        <div className={styles.statsGrid}>
                            {renderList(
                                'Najpopularniejsze gry',
                                statistics.mostPopularGames,
                                'Brak danych o popularnych grach.'
                            )}

                            {renderList(
                                'Popularne platformy',
                                statistics.popularPlatforms,
                                'Brak danych o platformach.'
                            )}

                            {renderList(
                                'Popularne gatunki',
                                statistics.popularGenres,
                                'Brak danych o gatunkach.'
                            )}

                            {renderList(
                                'Najwyżej oceniane gry',
                                statistics.highestRatedGames,
                                'Brak danych o ocenach gier.'
                            )}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}