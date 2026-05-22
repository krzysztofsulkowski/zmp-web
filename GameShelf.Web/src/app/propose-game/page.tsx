import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProposeGame.module.css';
import arrowBack from '@/assets/arrow-back.svg';

type Option = {
    id: number;
    name: string;
};

export default function ProposeGamePage() {
    const navigate = useNavigate();

    const [genres, setGenres] = useState<Option[]>([]);
    const [platforms, setPlatforms] = useState<Option[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [genreId, setGenreId] = useState('');
    const [platformId, setPlatformId] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const getToken = () => localStorage.getItem('authToken');

    const loadOptions = async () => {
        const token = getToken();

        const [genresResponse, platformsResponse] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/games/genres`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/games/platforms`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        ]);

        if (!genresResponse.ok || !platformsResponse.ok) {
            throw new Error('Nie udało się pobrać gatunków lub platform.');
        }

        const genresData = await genresResponse.json();
        const platformsData = await platformsResponse.json();

        setGenres(Array.isArray(genresData) ? genresData : []);
        setPlatforms(Array.isArray(platformsData) ? platformsData : []);
    };

    const submitProposal = async () => {
        setError('');
        setSuccessMessage('');

        if (!title.trim() || !genreId || !platformId) {
            setError('Uzupełnij tytuł, gatunek i platformę.');
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append('Title', title);
            formData.append('Description', description);
            formData.append('GenreId', genreId);
            formData.append('PlatformId', platformId);

            if (image) {
                formData.append('Image', image);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/propose`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Nie udało się wysłać propozycji.');
            }

            setSuccessMessage('Propozycja gry została wysłana do administratora.');
            setTitle('');
            setDescription('');
            setGenreId('');
            setPlatformId('');
            setImage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania propozycji.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOptions().catch((err) => {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        });
    }, []);

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <button
                    className={styles.backButton}
                    onClick={() => navigate('/games')}
                >
                    <img src={arrowBack} alt="Wróć" />
                </button>

                <h1 className={styles.title}>Zaproponuj grę</h1>

                <form className={styles.form}>
                    <div className={styles.field}>
                        <label>Tytuł gry</label>
                        <input
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Gatunek</label>
                        <select
                            className={styles.select}
                            value={genreId}
                            onChange={(e) => setGenreId(e.target.value)}
                        >
                            <option value="">Wybierz gatunek</option>
                            {genres.map((genre) => (
                                <option key={genre.id} value={genre.id}>
                                    {genre.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Platforma</label>
                        <select
                            className={styles.select}
                            value={platformId}
                            onChange={(e) => setPlatformId(e.target.value)}
                        >
                            <option value="">Wybierz platformę</option>
                            {platforms.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                    {platform.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Okładka</label>
                        <input
                            type="file"
                            className={styles.fileInput}
                            accept="image/*"
                            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                            key={image ? image.name : 'empty'}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Opis gry</label>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className={styles.submitButton}
                        onClick={submitProposal}
                        disabled={loading}
                    >
                        {loading ? 'Wysyłanie...' : 'Wyślij propozycję'}
                    </button>
                </form>

                {error && <p className={styles.error}>{error}</p>}
                {successMessage && <p className={styles.success}>{successMessage}</p>}
            </section>
        </main>
    );
}