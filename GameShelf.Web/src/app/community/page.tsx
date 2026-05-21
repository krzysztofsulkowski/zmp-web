import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Community.module.css';
import { Navbar } from '@/components/Navbar/Navbar';

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
};

const medals = ['🥇', '🥈', '🥉'];

export default function CommunityPage() {
    const navigate = useNavigate();

    const [statistics, setStatistics] = useState<GlobalStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const loadStatistics = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/statistics/global`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error();
            const data = await response.json() as GlobalStatistics;
            setStatistics(data);
        } catch {
            setErrorMessage('Nie udało się pobrać statystyk społeczności.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStatistics().catch(console.error);
    }, []);

    const renderList = (title: string, items: StatisticItem[], emptyText: string, valueLabel: string) => (
        <article className={styles.statCard}>
            <h2>{title}</h2>
            {items.length > 0 ? (
                <div className={styles.rankingList}>
                    {items.map((item, index) => (
                        <div
                            className={`${styles.rankingItem} ${index === 0 ? styles.rankingItemFirst : ''}`}
                            key={`${item.label}-${index}`}
                        >
                            <div className={styles.rankingLeft}>
                                <span className={styles.position}>
                                    {index < 3 ? medals[index] : index + 1}
                                </span>
                                <span className={styles.rankingLabel}>{item.label}</span>
                            </div>
                            <span className={styles.rankingValue}>{item.value} {valueLabel}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.emptyText}>{emptyText}</p>
            )}
        </article>
    );

    return (
        <main className={styles.page}>
            <Navbar activePage="community" />

            <section className={styles.content}>
                <h1>Społeczność GameShelf</h1>
                <p className={styles.subtitle}>
                    Zobacz globalne statystyki aplikacji, najpopularniejsze gry, platformy i gatunki wybierane przez użytkowników.
                </p>

                {isLoading && (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <p>Ładowanie statystyk...</p>
                    </div>
                )}

                {!isLoading && errorMessage && (
                    <p className={styles.errorText}>{errorMessage}</p>
                )}

                {!isLoading && statistics && (
                    <>
                        <div className={styles.summaryRow}>
                            <div className={styles.summaryBubble}>
                                <span className={styles.summaryNumber}>{statistics.totalUsers}</span>
                                <span className={styles.summaryLabel}>użytkowników</span>
                            </div>
                            <div className={styles.summaryBubble}>
                                <span className={styles.summaryNumber}>{statistics.totalGamesInLibrary}</span>
                                <span className={styles.summaryLabel}>gier w systemie</span>
                            </div>
                            <div className={styles.summaryBubble}>
                                <span className={styles.summaryNumber}>{statistics.totalUserGames}</span>
                                <span className={styles.summaryLabel}>gier w kolekcjach</span>
                            </div>
                        </div>

                        <div className={styles.statsGrid}>
                            {renderList('Najpopularniejsze gry', statistics.mostPopularGames, 'Brak danych.', 'graczy')}
                            {renderList('Popularne platformy', statistics.popularPlatforms, 'Brak danych.', 'użytkowników')}
                            {renderList('Popularne gatunki', statistics.popularGenres, 'Brak danych.', 'gier')}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}