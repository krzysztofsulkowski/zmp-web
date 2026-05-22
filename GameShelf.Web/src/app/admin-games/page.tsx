import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminGames.module.css';
import arrowBack from '@/assets/arrow-back.svg';

type Genre = { id: number; name: string; };
type Platform = { id: number; name: string; };

type Game = {
    id: number;
    title: string;
    description: string;
    genreId: number;
    genre?: Genre;
    imageUrl: string;
    status: number;
    suggestedByUserId: string;
    platformId: number;
    platform?: Platform;
    rejectionReason: string;
};

type AvailableGame = {
    id: number;
    title: string;
    description: string;
    genreName?: string;
    platformName?: string;
    genre?: { id: number; name: string; };
    platform?: { id: number; name: string; };
    imageUrl: string;
};

type AvailableGamesResponse = { data: AvailableGame[]; };

export default function AdminGamesPage() {
    const navigate = useNavigate();

    const [games, setGames] = useState<AvailableGame[]>([]);
    const [pendingGames, setPendingGames] = useState<Game[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [genreId, setGenreId] = useState('');
    const [platformId, setPlatformId] = useState('');
    const [image, setImage] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const getToken = () => localStorage.getItem('authToken');

    const loadGames = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/available-table`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ draw: 1, start: 0, length: 100, searchValue: '', orderColumn: 0, orderDir: 'asc', extraFilters: {} })
        });
        if (!response.ok) throw new Error('Nie udało się pobrać listy gier.');
        const data = await response.json() as AvailableGamesResponse;
        setGames(data.data ?? []);
    };

    const loadPendingGames = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/pending-approvals`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Nie udało się pobrać propozycji gier.');
        const data = await response.json() as Game[];
        setPendingGames(Array.isArray(data) ? data : []);
    };

    const loadGenres = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/genres`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Nie udało się pobrać gatunków.');
        const data = await response.json();
        setGenres(Array.isArray(data) ? data : []);
    };

    const loadPlatforms = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/platforms`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Nie udało się pobrać platform.');
        const data = await response.json();
        setPlatforms(Array.isArray(data) ? data : []);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            await Promise.all([loadGames(), loadPendingGames(), loadGenres(), loadPlatforms()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setLoading(false);
        }
    };

    const createGame = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccessMessage('');
            const formData = new FormData();
            formData.append('Title', title);
            formData.append('Description', description);
            formData.append('GenreId', genreId);
            formData.append('PlatformId', platformId);
            if (image) formData.append('Image', image);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/create-game`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData
            });
            if (!response.ok) throw new Error('Nie udało się dodać gry.');
            setTitle(''); setDescription(''); setGenreId(''); setPlatformId(''); setImage(null);
            setSuccessMessage('Gra została dodana.');
            await loadGames();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setSaving(false);
        }
    };

    const deleteGame = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę grę?')) return;
        try {
            setError(''); setSuccessMessage('');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/delete-game/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Nie udało się usunąć gry.');
            setSuccessMessage('Gra została usunięta.');
            await loadGames();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        }
    };

    const acceptGame = async (id: number) => {
        try {
            setError(''); setSuccessMessage('');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/accept/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Nie udało się zaakceptować gry.');
            setSuccessMessage('Gra została zaakceptowana.');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        }
    };

    const rejectGame = async (id: number) => {
        const reason = window.prompt('Podaj powód odrzucenia propozycji:', '');
        try {
            setError(''); setSuccessMessage('');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/reject-proposal/${id}?reason=${encodeURIComponent(reason ?? '')}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Nie udało się odrzucić propozycji.');
            setSuccessMessage('Propozycja została odrzucona.');
            await loadPendingGames();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        }
    };

    const getImageUrl = (imageUrl: string) => {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${import.meta.env.VITE_API_URL}${imageUrl}`;
    };

    useEffect(() => { loadData(); }, []);

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate('/admin')}>
                        <img src={arrowBack} alt="Wróć" width={20} height={20} />
                    </button>
                    <h1 className={styles.title}>Gry</h1>
                    <div className={styles.headerSpacer} />
                </div>

                {successMessage && <div className={styles.success}>{successMessage}</div>}
                {error && <div className={styles.error}>{error}</div>}
                {loading && <div className={styles.state}>Ładowanie danych...</div>}

                {!loading && (
                    <>
                        <div className={styles.formCard}>
                            <h2>Dodaj grę</h2>
                            <div className={styles.formGrid}>
                                <input type="text" placeholder="Tytuł" value={title} onChange={e => setTitle(e.target.value)} />
                                <select value={genreId} onChange={e => setGenreId(e.target.value)}>
                                    <option value="">Wybierz gatunek</option>
                                    {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                                <select value={platformId} onChange={e => setPlatformId(e.target.value)}>
                                    <option value="">Wybierz platformę</option>
                                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] ?? null)} />
                                <textarea placeholder="Opis" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <button className={styles.primaryButton} onClick={createGame} disabled={saving || !title || !genreId || !platformId}>
                                {saving ? 'Zapisywanie...' : 'Dodaj grę'}
                            </button>
                        </div>

                        <div className={styles.sectionHeader}>
                            <h2>Propozycje oczekujące</h2>
                            <span>{pendingGames.length}</span>
                        </div>

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Tytuł</th>
                                        <th>Gatunek</th>
                                        <th>Platforma</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingGames.map(game => (
                                        <tr key={game.id}>
                                            <td>
                                                <div className={styles.gameCell}>
                                                    <div className={styles.cover}>
                                                        {game.imageUrl ? <img src={getImageUrl(game.imageUrl)} alt={game.title} /> : <span>Brak</span>}
                                                    </div>
                                                    <div>
                                                        <strong>{game.title}</strong>
                                                        <p>{game.description || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{game.genre?.name || '—'}</td>
                                            <td>{game.platform?.name || '—'}</td>
                                            <td><span className={styles.pendingBadge}>Oczekuje</span></td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button className={styles.acceptButton} onClick={() => acceptGame(game.id)}>Akceptuj</button>
                                                    <button className={styles.rejectButton} onClick={() => rejectGame(game.id)}>Odrzuć</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pendingGames.length === 0 && <div className={styles.empty}>Brak propozycji oczekujących.</div>}
                        </div>

                        <div className={styles.sectionHeader}>
                            <h2>Globalna biblioteka</h2>
                            <span>{games.length}</span>
                        </div>

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Gra</th>
                                        <th>Gatunek</th>
                                        <th>Platforma</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {games.map(game => (
                                        <tr key={game.id}>
                                            <td>
                                                <div className={styles.gameCell}>
                                                    <div className={styles.cover}>
                                                        {game.imageUrl ? <img src={getImageUrl(game.imageUrl)} alt={game.title} /> : <span>Brak</span>}
                                                    </div>
                                                    <div>
                                                        <strong>{game.title}</strong>
                                                        <p>{game.description || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{game.genreName || game.genre?.name || '—'}</td>
                                            <td>{game.platformName || game.platform?.name || '—'}</td>
                                            <td>
                                                <button className={styles.deleteButton} onClick={() => deleteGame(game.id)}>Usuń</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {games.length === 0 && <div className={styles.empty}>Brak gier do wyświetlenia.</div>}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}