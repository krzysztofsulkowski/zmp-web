import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Games.module.css';
import logo from '@/assets/logo.svg';

type Game = {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    genre?: {
        id: number;
        name: string;
    };
    platform?: {
        id: number;
        name: string;
    };
};

type GamesResponse = {
    data?: Game[];
};

export default function GamesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const collectionId = searchParams.get('collectionId');

    const [searchValue, setSearchValue] = useState('');
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const fetchGames = async (value: string) => {
        if (!value.trim()) {
            setGames([]);
            return;
        }

        try {
            setIsLoading(true);

            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/available-table`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    draw: 1,
                    start: 0,
                    length: 20,
                    searchValue: value.trim(),
                    orderColumn: 0,
                    orderDir: 'asc',
                    extraFilters: {}
                })
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać gier');
            }

            const data = await response.json() as GamesResponse;

            setGames(data.data ?? []);
        } catch (err) {
            console.error(err);
            setGames([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            fetchGames(searchValue);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [searchValue]);

    const addGameToCollection = async (gameId: number) => {
        try {
            const token = localStorage.getItem('authToken');

            const url = collectionId
                ? `${import.meta.env.VITE_API_URL}/api/games/add-to-collection/${gameId}?collectionId=${collectionId}`
                : `${import.meta.env.VITE_API_URL}/api/games/add-to-collection/${gameId}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się dodać gry');
            }

            setMessage('Gra została dodana do kolekcji.');
        } catch (err) {
            console.error(err);
            setMessage('Nie udało się dodać gry.');
        }
    };

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <button className={styles.backButton} onClick={() => navigate('/dashboard')}>
                    Wróć do kolekcji
                </button>
            </nav>

            <section className={styles.content}>
                <h1>Dodaj grę do kolekcji</h1>

                <p className={styles.subtitle}>
                    Wyszukaj grę po tytule, a następnie dodaj ją do wybranej kolekcji.
                </p>

                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Wpisz nazwę gry..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />

                {message && <p className={styles.message}>{message}</p>}

                {isLoading && <p className={styles.statusText}>Ładowanie gier...</p>}

                {!isLoading && searchValue.trim() && games.length === 0 && (
                    <p className={styles.statusText}>Nie znaleziono gier.</p>
                )}

                <div className={styles.gamesGrid}>
                    {games.map((game) => (
                        <article key={game.id} className={styles.gameCard}>
                            <div className={styles.imageWrapper}>
                                {game.imageUrl ? (
                                    <img src={game.imageUrl} alt={game.title} />
                                ) : (
                                    <div className={styles.placeholder}>Brak obrazu</div>
                                )}
                            </div>

                            <div className={styles.gameInfo}>
                                <h2>{game.title}</h2>

                                <p>
                                    {game.genre?.name ?? 'Brak gatunku'} · {game.platform?.name ?? 'Brak platformy'}
                                </p>

                                <button onClick={() => addGameToCollection(game.id)}>
                                    Dodaj do kolekcji
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}