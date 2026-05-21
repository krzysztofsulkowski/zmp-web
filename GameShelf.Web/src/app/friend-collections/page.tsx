import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './FriendCollections.module.css';
import logo from '@/assets/logo.svg';
import arrowLeft from '@/assets/arrow-left.svg';
import arrowRight from '@/assets/arrow-right.svg';

type CollectionGame = {
    gameId: number;
    title: string;
    imageUrl: string | null;
    description: string | null;
    genreName: string;
    platformName: string;
    collectionId: number;
    collectionName: string;
    addedAt: string;
};

type CollectionWithGames = {
    collectionId: number;
    collectionName: string;
    isPublic: boolean;
    games: CollectionGame[];
};

type FriendProfile = {
    id?: string;
    userId?: string;
    username?: string;
    userName?: string;
    avatarUrl?: string;
    bio?: string;
    email?: string;
};

type CompareGame = {
    gameId: number;
    title: string;
    imageUrl?: string | null;
    genreName?: string;
    ownedByMe: boolean;
    ownedByFriend: boolean;
    myCollectionName?: string | null;
    friendCollectionName?: string | null;
};

type AvailableGameImage = {
    id: number;
    imageUrl: string;
};

export default function FriendCollectionsPage() {
    const navigate = useNavigate();
    const { friendId } = useParams<{ friendId: string }>();

    const tabsRef = useRef<HTMLDivElement | null>(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [myAvatarUrl, setMyAvatarUrl] = useState('');

    const [friend, setFriend] = useState<FriendProfile | null>(null);
    const [collections, setCollections] = useState<CollectionWithGames[]>([]);
    const [gameImages, setGameImages] = useState<Record<number, string>>({});
    const [compareGames, setCompareGames] = useState<CompareGame[]>([]);
    const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return { Authorization: `Bearer ${token}` };
    };

    const resolveUrl = (url?: string | null) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const getFriendName = () =>
        friend?.userName ?? friend?.username ?? 'Nieznany użytkownik';

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const scrollTabs = (direction: 'left' | 'right') => {
        if (!tabsRef.current) return;
        tabsRef.current.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pl-PL');

    const getGameImage = (game: CollectionGame) => {
        return resolveUrl(game.imageUrl) || resolveUrl(gameImages[game.gameId]);
    };

    const isInMine = (g: CompareGame) => g.ownedByMe;
    const isInFriend = (g: CompareGame) => g.ownedByFriend;

    const loadMyAvatar = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/authentication/me`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();
        setMyAvatarUrl(resolveUrl(data.avatarUrl));
    };

    const loadFriendProfile = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/my-friends`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: FriendProfile[] = Array.isArray(data) ? data : data.data ?? [];
        const found = list.find((f) => (f.userId ?? f.id) === friendId || f.id === friendId);
        if (found) setFriend(found);
    };

    const loadFriendCollections = async () => {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/friends/${friendId}/collections-with-games`,
            { headers: getAuthHeaders() }
        );
        if (!res.ok) throw new Error('Nie udało się pobrać kolekcji znajomego.');

        const data = await res.json();
        const list: CollectionWithGames[] = Array.isArray(data) ? data : data.data ?? [];
        const publicOnes = list.filter((c) => c.isPublic);

        setCollections(publicOnes);
        if (publicOnes.length > 0) setActiveCollectionId(publicOnes[0].collectionId);

        if (!Array.isArray(data) && data.friendProfile) setFriend(data.friendProfile);
        if (!Array.isArray(data) && data.user) setFriend(data.user);
    };

    const loadGameImages = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/games/available-table`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
                draw: 1, start: 0, length: 1000,
                searchValue: '', orderColumn: 0, orderDir: 'asc', extraFilters: {}
            })
        });
        if (!res.ok) return;
        const data = await res.json();
        const games: AvailableGameImage[] = Array.isArray(data.data) ? data.data : [];
        const map = games.reduce<Record<number, string>>((acc, g) => {
            if (g.imageUrl) acc[g.id] = g.imageUrl;
            return acc;
        }, {});
        setGameImages(map);
    };

    const loadCompare = async () => {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/friends/compare/${friendId}`,
            { headers: getAuthHeaders() }
        );
        if (!res.ok) return;
        const data = await res.json();
        const list: CompareGame[] = Array.isArray(data) ? data : data.data ?? [];
        setCompareGames(list);
    };

    useEffect(() => {
        if (!friendId) return;
        setIsLoading(true);
        Promise.all([
            loadMyAvatar(),
            loadFriendProfile(),
            loadFriendCollections(),
            loadGameImages(),
            loadCompare()
        ])
            .catch((err) => {
                console.error(err);
                setError('Nie udało się załadować danych.');
            })
            .finally(() => setIsLoading(false));
    }, [friendId]);

    const activeCollection = collections.find((c) => c.collectionId === activeCollectionId);
    const activeGames = activeCollection?.games ?? [];

    const sharedGames = compareGames.filter((g) => isInMine(g) && isInFriend(g));
    const onlyMine = compareGames.filter((g) => isInMine(g) && !isInFriend(g));
    const onlyFriend = compareGames.filter((g) => !isInMine(g) && isInFriend(g));

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button onClick={() => navigate('/dashboard')}>STRONA GŁÓWNA</button>
                    <button onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
                    <button className={styles.activeNav} onClick={() => navigate('/friends')}>ZNAJOMI</button>
                    <button onClick={() => navigate('/faq')}>FAQ</button>
                    <button onClick={() => navigate('/about')}>O NAS</button>
                </div>

                <div className={styles.profileWrapper}>
                    <button className={styles.profileButton} onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                        {myAvatarUrl && <img src={myAvatarUrl} alt="Avatar" />}
                    </button>
                    {isProfileMenuOpen && (
                        <div className={styles.profileMenu}>
                            <button onClick={() => navigate('/profile')}>Ustawienia</button>
                            <button onClick={handleLogout}>Wyloguj się</button>
                        </div>
                    )}
                </div>
            </nav>

            <section className={styles.content}>
                <button className={styles.backButton} onClick={() => navigate('/friends')}>
                    ← Wróć do znajomych
                </button>

                {isLoading && (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <p>Ładowanie profilu...</p>
                    </div>
                )}

                {error && <p className={styles.errorText}>{error}</p>}

                {!isLoading && !error && (
                    <>
                        <div className={styles.profileHeader}>
                            <div className={styles.profileAvatarWrap}>
                                {resolveUrl(friend?.avatarUrl) ? (
                                    <img src={resolveUrl(friend?.avatarUrl)} alt={getFriendName()} className={styles.profileAvatar} />
                                ) : (
                                    <div className={styles.profileAvatarFallback}>
                                        {getFriendName().charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className={styles.profileInfo}>
                                <h1>{getFriendName()}</h1>
                                {friend?.bio && <p className={styles.bio}>{friend.bio}</p>}
                                <span className={styles.collectionCount}>
                                    {collections.length} publicznych kolekcji
                                </span>
                            </div>
                        </div>

                        <div className={styles.collectionsBox}>
                            <h2 className={styles.sectionTitle}>Kolekcje</h2>

                            {collections.length === 0 ? (
                                <p className={styles.emptyText}>
                                    Ten użytkownik nie ma żadnych publicznych kolekcji.
                                </p>
                            ) : (
                                <>
                                    <div className={styles.tabsWrapper}>
                                        <button className={styles.tabsArrow} onClick={() => scrollTabs('left')}>
                                            <img src={arrowLeft} alt="scroll left" />
                                        </button>

                                        <div className={styles.tabs} ref={tabsRef}>
                                            {collections.map((c) => (
                                                <button
                                                    key={c.collectionId}
                                                    className={activeCollectionId === c.collectionId ? styles.activeTab : ''}
                                                    onClick={() => setActiveCollectionId(c.collectionId)}
                                                >
                                                    {c.collectionName}
                                                    <span className={styles.tabCount}>{c.games.length}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <button className={styles.tabsArrow} onClick={() => scrollTabs('right')}>
                                            <img src={arrowRight} alt="scroll right" />
                                        </button>
                                    </div>

                                    {activeGames.length === 0 ? (
                                        <p className={styles.emptyText}>Ta kolekcja jest pusta.</p>
                                    ) : (
                                        <div className={styles.gamesGrid}>
                                            {activeGames.map((game) => {
                                                const img = getGameImage(game);
                                                return (
                                                    <article key={`${game.collectionId}-${game.gameId}`} className={styles.gameCard}>
                                                        <div className={styles.gameImage}>
                                                            {img
                                                                ? <img src={img} alt={game.title} />
                                                                : <div className={styles.gamePlaceholder}>Brak okładki</div>
                                                            }
                                                        </div>
                                                        <div className={styles.gameInfo}>
                                                            <h3>{game.title}</h3>
                                                            <p className={styles.gameMeta}>
                                                                {game.genreName || 'Brak gatunku'} · {game.platformName || 'Brak platformy'}
                                                            </p>
                                                            <p className={styles.gameDate}>
                                                                Dodano: {game.addedAt ? formatDate(game.addedAt) : '—'}
                                                            </p>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <section className={styles.compareSection}>
                            <h2 className={styles.sectionTitle}>Wasza wspólna półka</h2>

                            <div className={styles.compareStats}>
                                <div className={styles.compareStatBubble}>
                                    <span className={styles.compareStatNumber}>{sharedGames.length}</span>
                                    <span className={styles.compareStatLabel}>Gracie razem</span>
                                </div>
                                <div className={styles.compareStatBubble}>
                                    <span className={styles.compareStatNumber}>{onlyMine.length}</span>
                                    <span className={styles.compareStatLabel}>Tylko Ty masz</span>
                                </div>
                                <div className={styles.compareStatBubble}>
                                    <span className={styles.compareStatNumber}>{onlyFriend.length}</span>
                                    <span className={styles.compareStatLabel}>Tylko {getFriendName()} ma</span>
                                </div>
                            </div>

                            {compareGames.length === 0 && (
                                <p className={styles.emptyText}>Brak danych do porównania.</p>
                            )}

                            {sharedGames.length > 0 && (
                                <div className={styles.compareGroup}>
                                    <h3 className={styles.compareGroupTitle}>
                                        <span className={styles.sharedDot} /> Oboje gracie
                                    </h3>
                                    <div className={styles.compareChips}>
                                        {sharedGames.map((g) => (
                                            <div key={g.gameId} className={`${styles.gameChip} ${styles.sharedChip}`}>
                                                {resolveUrl(g.imageUrl ?? gameImages[g.gameId]) && (
                                                    <img src={resolveUrl(g.imageUrl ?? gameImages[g.gameId])} alt={g.title} />
                                                )}
                                                <span>{g.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {onlyFriend.length > 0 && (
                                <div className={styles.compareGroup}>
                                    <h3 className={styles.compareGroupTitle}>
                                        <span className={styles.friendDot} /> Tylko u {getFriendName()} — może Cię zainteresować
                                    </h3>
                                    <div className={styles.compareChips}>
                                        {onlyFriend.map((g) => (
                                            <div key={g.gameId} className={`${styles.gameChip} ${styles.friendChip}`}>
                                                {resolveUrl(g.imageUrl ?? gameImages[g.gameId]) && (
                                                    <img src={resolveUrl(g.imageUrl ?? gameImages[g.gameId])} alt={g.title} />
                                                )}
                                                <span>{g.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {onlyMine.length > 0 && (
                                <div className={styles.compareGroup}>
                                    <h3 className={styles.compareGroupTitle}>
                                        <span className={styles.mineDot} /> Tylko u Ciebie
                                    </h3>
                                    <div className={styles.compareChips}>
                                        {onlyMine.map((g) => (
                                            <div key={g.gameId} className={`${styles.gameChip} ${styles.mineChip}`}>
                                                {resolveUrl(g.imageUrl ?? gameImages[g.gameId]) && (
                                                    <img src={resolveUrl(g.imageUrl ?? gameImages[g.gameId])} alt={g.title} />
                                                )}
                                                <span>{g.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </section>
        </main>
    );
}