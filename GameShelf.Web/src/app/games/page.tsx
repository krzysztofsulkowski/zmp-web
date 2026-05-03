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

type Collection = {
    id: number;
    name: string;
    isPublic: boolean;
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
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [selectedRating, setSelectedRating] = useState('5');

    const loadCollections = async () => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/lookup`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Nie udało się pobrać kolekcji');
        }

        const data = await response.json();

        const result: Collection[] = Array.isArray(data)
            ? data
            : Array.isArray(data.data)
                ? data.data
                : [];

        const collectionsWithoutLibrary = result.filter((collection) => collection.name !== 'Biblioteka');

        setCollections(collectionsWithoutLibrary);

        if (collectionId) {
            setSelectedCollectionId(collectionId);
        } else if (collectionsWithoutLibrary.length > 0) {
            setSelectedCollectionId(String(collectionsWithoutLibrary[0].id));
        }
    };

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
        loadCollections().catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            fetchGames(searchValue);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [searchValue]);

    const openAddGameModal = (game: Game) => {
        setSelectedGame(game);
        setSelectedRating('5');

        if (collectionId) {
            setSelectedCollectionId(collectionId);
        }

        if (!collectionId && collections.length > 0) {
            setSelectedCollectionId(String(collections[0].id));
        }

        setMessage(null);
    };

    const closeModal = () => {
        setSelectedGame(null);
    };

    const saveGameToCollection = async () => {
        if (!selectedGame || !selectedCollectionId) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/add-to-collection/${selectedGame.id}?collectionId=${selectedCollectionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się dodać gry');
            }

            setMessage('Gra została dodana do kolekcji.');
            setSelectedGame(null);
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

                                <button onClick={() => openAddGameModal(game)}>
                                    Dodaj do kolekcji
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {selectedGame && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Dodaj grę do kolekcji</h2>

                        <div className={styles.modalGamePreview}>
                            {selectedGame.imageUrl ? (
                                <img src={selectedGame.imageUrl} alt={selectedGame.title} />
                            ) : (
                                <div className={styles.modalPlaceholder}>Brak obrazu</div>
                            )}

                            <div>
                                <h3>{selectedGame.title}</h3>
                                <p>Kategoria: {selectedGame.genre?.name ?? 'Brak kategorii'}</p>
                                <p>Platforma: {selectedGame.platform?.name ?? 'Brak platformy'}</p>
                            </div>
                        </div>

                        <label className={styles.modalLabel}>
                            Kolekcja
                            <select
                                value={selectedCollectionId}
                                onChange={(e) => setSelectedCollectionId(e.target.value)}
                            >
                                {collections.map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                        {collection.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className={styles.modalLabel}>
                            Ocena
                            <select
                                value={selectedRating}
                                onChange={(e) => setSelectedRating(e.target.value)}
                            >
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                        </label>

                        <div className={styles.modalActions}>
                            <button onClick={closeModal}>Anuluj</button>
                            <button onClick={saveGameToCollection}>Zapisz</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}