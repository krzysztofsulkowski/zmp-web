import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Dashboard.module.css";
import logo from "@/assets/logo.svg";
import addIcon from '@/assets/add.svg';
import arrowLeft from '@/assets/arrow-left.svg';
import arrowRight from '@/assets/arrow-right.svg';
import editIcon from '@/assets/edit.svg';
import deleteIcon from '@/assets/delete.svg';
import eyeOnIcon from '@/assets/eye-on.svg';
import eyeOffIcon from '@/assets/eye-off.svg';
import linkIcon from '@/assets/link.svg';
import starIcon from '@/assets/star.svg';

type CollectionTab = 'library' | 'favorites' | 'planned' | 'wishlist' | 'playing' | 'completed' | 'abandoned';

type SortOption = 'newest' | 'oldest' | 'titleAsc' | 'titleDesc';

type Collection = {
    id: number;
    name: string;
    isPublic?: boolean;
    shareCode?: string;
};

type CollectionGame = {
    gameId: number;
    title: string;
    imageUrl: string;
    description: string;
    genreName: string;
    platformName: string;
    collectionId: number;
    collectionName: string;
    addedAt: string;
    type?: string;
};

type AvailableGameImage = {
    id: number;
    imageUrl: string;
};

type CollectionWithGames = {
    collectionId: number;
    collectionName: string;
    isPublic: boolean;
    games: CollectionGame[];
};

type CollectionsWithGamesResponse = {
    data?: CollectionWithGames[];
};

type UserProfile = {
    avatarUrl: string;
};

type StatItem = {
    label: string;
    value: number;
};

type MyLibraryStats = {
    totalGames: number;
    addedRecentlyCount: number;
    gamesByGenre: StatItem[];
    gamesByPlatform: StatItem[];
    gamesByCollection: StatItem[];
};

const favoriteGamesStorageKey = 'favoriteGameIds';

const tabs: { key: CollectionTab; label: string }[] = [
    { key: 'library', label: 'Biblioteka' },
    { key: 'favorites', label: 'Ulubione' },
    { key: 'planned', label: 'Planowane' },
    { key: 'wishlist', label: 'Lista życzeń' },
    { key: 'playing', label: 'W trakcie' },
    { key: 'completed', label: 'Ukończone' },
    { key: 'abandoned', label: 'Porzucone' }
];

const defaultCollectionNames = [
    'Biblioteka',
    'Ulubione',
    'Planowane',
    'Lista życzeń',
    'W trakcie',
    'Ukończone',
    'Porzucone'
];

const emptyStates: Record<CollectionTab, { title: string; description: string; button: string }> = {
    library: {
        title: 'Biblioteka to miejsce, w którym znajdziesz wszystkie swoje gry - bez podziału na kategorie.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj pierwszą grę'
    },
    favorites: {
        title: 'Kolekcja Ulubione to miejsce, w którym znajdziesz gry oznaczone przez Ciebie jako najlepsze - Twoje absolutne top tytuły.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj ulubioną grę'
    },
    planned: {
        title: 'Kolekcja Planowane to miejsce, w którym znajdziesz wszystkie gry oznaczone przez Ciebie jako do zagrania w przyszłości - Twoja lista tytułów do nadrobienia.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj planowaną grę'
    },
    wishlist: {
        title: 'Kolekcja Lista życzeń to miejsce, w którym znajdziesz wszystkie gry, które chcesz zdobyć - Twoje wymarzone tytuły na przyszłość.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj do listy życzeń'
    },
    playing: {
        title: 'Kolekcja W trakcie to miejsce, w którym znajdziesz wszystkie gry, w które aktualnie grasz - Twoje obecne rozgrywki.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj grę w trakcie'
    },
    completed: {
        title: 'Kolekcja Ukończone to miejsce, w którym znajdziesz wszystkie gry, które już przeszedłeś - Twoje zamknięte historie i osiągnięcia.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj ukończoną grę'
    },
    abandoned: {
        title: 'Kolekcja Porzucone to miejsce, w którym znajdziesz wszystkie gry, których nie ukończyłeś - tytuły, do których już nie planujesz wracać.',
        description: 'Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.',
        button: 'dodaj porzuconą grę'
    }
};

export default function Dashboard() {
    const navigate = useNavigate();
    const tabsRef = useRef<HTMLDivElement | null>(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const [avatarUrl, setAvatarUrl] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login', { replace: true });
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

    const [activeTab, setActiveTab] = useState<CollectionTab>('library');
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [customCollections, setCustomCollections] = useState<Collection[]>([]);
    const [collectionsWithGames, setCollectionsWithGames] = useState<CollectionWithGames[]>([]);
    const [gameImages, setGameImages] = useState<Record<number, string>>({});
    const [activeCustomCollectionId, setActiveCustomCollectionId] = useState<number | null>(null);
    const [libraryStats, setLibraryStats] = useState<MyLibraryStats | null>(null);

    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const tilesPerPage = 15;
    const gamesPerPage = tilesPerPage - 1;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [editedCollectionName, setEditedCollectionName] = useState('');

    const activeEmptyState = emptyStates[activeTab];
    const activeCustomCollection = customCollections.find((collection) => collection.id === activeCustomCollectionId);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (!tabsRef.current) {
            return;
        }

        tabsRef.current.scrollBy({
            left: direction === 'left' ? -220 : 220,
            behavior: 'smooth'
        });
    };

    const getFavoriteGameIds = () => {
        const savedIds = localStorage.getItem(favoriteGamesStorageKey);

        if (!savedIds) {
            return [];
        }

        return JSON.parse(savedIds) as number[];
    };

    const getActiveDefaultCollectionId = () => {
        const activeTabData = tabs.find((tab) => tab.key === activeTab);

        if (!activeTabData) {
            return null;
        }

        const collection = allCollections.find((item) => item.name === activeTabData.label);

        return collection?.id ?? null;
    };

    const activeDefaultCollectionId = getActiveDefaultCollectionId();

    const activeCollection = activeCustomCollectionId !== null
        ? activeCustomCollection
        : allCollections.find((collection) => collection.id === activeDefaultCollectionId);

    const isManualCollection = activeCustomCollectionId !== null;

    const getActiveGames = () => {
        if (activeTab === 'library' && activeCustomCollectionId === null) {
            return collectionsWithGames.flatMap((collection) => collection.games);
        }

        if (activeTab === 'favorites' && activeCustomCollectionId === null) {
            const favoriteIds = getFavoriteGameIds();

            return collectionsWithGames
                .flatMap((collection) => collection.games)
                .filter((game, index, games) =>
                    favoriteIds.includes(game.gameId) &&
                    games.findIndex((item) => item.gameId === game.gameId) === index
                );
        }

        const activeCollectionId = activeCustomCollectionId ?? getActiveDefaultCollectionId();

        if (activeCollectionId === null || activeCollectionId === undefined) {
            return [];
        }

        const collection = collectionsWithGames.find((item) => item.collectionId === activeCollectionId);

        return collection?.games ?? [];
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pl-PL');
    };

    const getGameImageUrl = (game: CollectionGame) => {
        const imageUrl = game.imageUrl || gameImages[game.gameId];

        if (!imageUrl) {
            return '';
        }

        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        return `${import.meta.env.VITE_API_URL}${imageUrl}`;
    };

    const handleAddGame = () => {
        const collectionId = activeCustomCollectionId ?? getActiveDefaultCollectionId();

        if (
            (activeTab === 'library' || activeTab === 'favorites') &&
            activeCustomCollectionId === null
        ) {
            navigate('/games');
            return;
        }

        if (collectionId === null || collectionId === undefined) {
            console.error('Brak ID aktywnej kolekcji');
            return;
        }

        navigate(`/games?collectionId=${collectionId}`);
    };

    const resetFilters = () => {
        setSortOption('newest');
        setSelectedGenre('');
        setSelectedPlatform('');
        setSelectedPlatform('');
        setCurrentPage(1);
    };

    const getUniqueValues = (games: CollectionGame[], field: 'genreName' | 'platformName' | 'type') => {
        return Array.from(
            new Set(
                games
                    .map((game) => game[field])
                    .filter((value): value is string => Boolean(value))
            )
        );
    };

    const applyFiltersAndSorting = (games: CollectionGame[]) => {
        let result = [...games];

        if (selectedGenre) {
            result = result.filter((game) => game.genreName === selectedGenre);
        }

        if (selectedPlatform) {
            result = result.filter((game) => game.platformName === selectedPlatform);
        }

        result.sort((firstGame, secondGame) => {
            if (sortOption === 'titleAsc') {
                return firstGame.title.localeCompare(secondGame.title);
            }

            if (sortOption === 'titleDesc') {
                return secondGame.title.localeCompare(firstGame.title);
            }

            if (sortOption === 'oldest') {
                return new Date(firstGame.addedAt).getTime() - new Date(secondGame.addedAt).getTime();
            }

            return new Date(secondGame.addedAt).getTime() - new Date(firstGame.addedAt).getTime();
        });

        return result;
    };

    const updateCollectionPrivacy = async () => {
        if (!activeCollection) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const newIsPublic = !(activeCollection.isPublic ?? true);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: activeCollection.id,
                    name: activeCollection.name,
                    isPublic: newIsPublic
                })
            });

            if (!response.ok) {
                throw new Error('Błąd zmiany widoczności kolekcji');
            }

            await loadCollections();
            await loadCollectionGames();

            setShowPrivacyModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    const copyCollectionLink = async () => {
        if (!activeCollection?.shareCode) {
            alert('Brak kodu udostępniania dla tej kolekcji.');
            return;
        }

        const link = `${window.location.origin}/collections/share/${activeCollection.shareCode}`;

        await navigator.clipboard.writeText(link);

        alert('Link do kolekcji został skopiowany.');
    };


    const loadCollections = async () => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/lookup`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Błąd pobierania kolekcji');
        }

        const data = await response.json();

        const collections: Collection[] = Array.isArray(data)
            ? data
            : Array.isArray(data.data)
                ? data.data
                : [];

        setAllCollections(collections);

        const customOnly = collections.filter(
            (collection) => !defaultCollectionNames.includes(collection.name)
        );

        setCustomCollections(customOnly);
    };

    const loadCollectionGames = async () => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/grouped-with-games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                draw: 1,
                start: 0,
                length: 100,
                searchValue: '',
                orderColumn: 0,
                orderDir: 'asc',
                extraFilters: {}
            })
        });

        if (!response.ok) {
            throw new Error('Błąd pobierania gier w kolekcjach');
        }

        const data = await response.json() as CollectionsWithGamesResponse;

        setCollectionsWithGames(data.data ?? []);
    };

    const loadGameImages = async () => {
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
                length: 1000,
                searchValue: '',
                orderColumn: 0,
                orderDir: 'asc',
                extraFilters: {}
            })
        });

        if (!response.ok) {
            throw new Error('Błąd pobierania okładek gier');
        }

        const data = await response.json();

        const games: AvailableGameImage[] = Array.isArray(data.data) ? data.data : [];

        const images = games.reduce<Record<number, string>>((result, game) => {
            result[game.id] = game.imageUrl;
            return result;
        }, {});

        setGameImages(images);
    };

    useEffect(() => {
        loadCollections().catch((err) => console.error(err));
        loadCollectionGames().catch((err) => console.error(err));
        loadGameImages().catch((err) => console.error(err));
        loadUserAvatar().catch((err) => console.error(err));
        loadLibraryStats().catch((err) => console.error(err));
    }, []);

    const createCollection = async () => {
        if (!newCollectionName.trim()) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newCollectionName.trim(),
                    isPublic: true
                })
            });

            if (!response.ok) {
                throw new Error('Błąd tworzenia kolekcji');
            }

            const createdCollection = await response.json() as { id?: number; data?: { id?: number } };
            const createdId = createdCollection.id ?? createdCollection.data?.id;

            await loadCollections();
            await loadCollectionGames();
            await loadGameImages();

            if (typeof createdId === 'number') {
                setActiveCustomCollectionId(createdId);
            }

            setShowCreateModal(false);
            setNewCollectionName('');
        } catch (err) {
            console.error(err);
        }
    };

    const updateCollectionName = async () => {
        if (!activeCustomCollection || !editedCollectionName.trim()) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: activeCustomCollection.id,
                    name: editedCollectionName.trim(),
                    isPublic: activeCustomCollection.isPublic ?? true
                })
            });

            if (!response.ok) {
                throw new Error('Błąd aktualizacji kolekcji');
            }

            setCustomCollections((prev) =>
                prev.map((collection) =>
                    collection.id === activeCustomCollection.id
                        ? { ...collection, name: editedCollectionName.trim() }
                        : collection
                )
            );

            setAllCollections((prev) =>
                prev.map((collection) =>
                    collection.id === activeCustomCollection.id
                        ? { ...collection, name: editedCollectionName.trim() }
                        : collection
                )
            );

            setCollectionsWithGames((prev) =>
                prev.map((collection) =>
                    collection.collectionId === activeCustomCollection.id
                        ? { ...collection, collectionName: editedCollectionName.trim() }
                        : collection
                )
            );

            setShowRenameModal(false);
            setEditedCollectionName('');
        } catch (err) {
            console.error(err);
        }
    };

    const deleteCollection = async () => {
        if (!activeCustomCollection) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/delete/${activeCustomCollection.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Błąd usuwania kolekcji');
            }

            setCustomCollections((prev) =>
                prev.filter((collection) => collection.id !== activeCustomCollection.id)
            );

            setAllCollections((prev) =>
                prev.filter((collection) => collection.id !== activeCustomCollection.id)
            );

            setCollectionsWithGames((prev) =>
                prev.filter((collection) => collection.collectionId !== activeCustomCollection.id)
            );

            setActiveCustomCollectionId(null);
            setActiveTab('library');
            setShowDeleteModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLibraryStats = async () => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/statistics/my-library`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Błąd pobierania statystyk');
        }

        const data = await response.json() as MyLibraryStats;

        setLibraryStats(data);
    };

    const activeGames = getActiveGames();
    const filteredGames = applyFiltersAndSorting(activeGames);
    const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
    const firstGameIndex = (currentPage - 1) * gamesPerPage;
    const visibleGames = filteredGames.slice(firstGameIndex, firstGameIndex + gamesPerPage);
    const genreOptions = getUniqueValues(activeGames, 'genreName');
    const platformOptions = getUniqueValues(activeGames, 'platformName');

    const getChartGradient = (items: StatItem[]) => {
        const total = items.reduce((sum, item) => sum + item.value, 0);

        if (total === 0) {
            return '#3f335c';
        }

        let current = 0;

        return items
            .map((item, index) => {
                const start = current;
                const percentage = (item.value / total) * 100;
                current += percentage;
                const end = current;

                return `${chartColors[index % chartColors.length]} ${start}% ${end}%`;
            })
            .join(', ');
    };

    const getTopStatLabel = (items: StatItem[]) => {
        if (items.length === 0) {
            return 'Brak danych';
        }

        const sortedItems = [...items].sort((a, b) => b.value - a.value);

        return `${sortedItems[0].label}: ${sortedItems[0].value}`;
    };

    const chartColors = ['#7C3AED', '#A78BFA', '#C4B5FD', '#EDE9FE', '#FFFFFF'];

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button className={styles.activeNav} onClick={() => navigate('/dashboard')}>STRONA GŁÓWNA</button>
                    <button onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
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
                <h1>Twoje kolekcje</h1>

                <div className={styles.collectionsBox}>
                    <div className={styles.tabsWrapper}>
                        <button className={styles.tabsArrow} onClick={() => scrollTabs('left')}>
                            <img src={arrowLeft} alt="scroll left" />
                        </button>

                        <div className={styles.tabs} ref={tabsRef}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={activeTab === tab.key && activeCustomCollectionId === null ? styles.activeTab : ''}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setActiveCustomCollectionId(null);
                                        resetFilters();
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}

                            {customCollections.map((collection) => (
                                <button
                                    key={collection.id}
                                    className={activeCustomCollectionId === collection.id ? styles.activeTab : ''}
                                    onClick={() => {
                                        setActiveCustomCollectionId(collection.id);
                                        resetFilters();
                                    }}
                                >
                                    {collection.name}
                                </button>
                            ))}

                            <button className={styles.addTab} onClick={() => setShowCreateModal(true)}>
                                <img src={addIcon} alt="add" />
                            </button>
                        </div>

                        <button className={styles.tabsArrow} onClick={() => scrollTabs('right')}>
                            <img src={arrowRight} alt="scroll right" />
                        </button>

                      
                    </div>

                    {activeGames.length > 0 ? (
                        <>
                            <div className={styles.gameControls}>
                                <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
                                    <option value="">Wszystkie platformy</option>
                                    {platformOptions.map((platform) => (
                                        <option key={platform} value={platform}>{platform}</option>
                                    ))}
                                </select>

                                <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                                    <option value="">Wszystkie kategorie</option>
                                    {genreOptions.map((genre) => (
                                        <option key={genre} value={genre}>{genre}</option>
                                    ))}
                                </select>

                                <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)}>
                                    <option value="newest">Sortuj: od najnowszych</option>
                                    <option value="oldest">Sortuj: od najstarszych</option>
                                    <option value="titleAsc">Sortuj: A-Z</option>
                                    <option value="titleDesc">Sortuj: Z-A</option>
                                </select>

                                <div className={styles.collectionActionButtons}>
                                    {isManualCollection && (
                                        <>
                                            <button
                                                className={styles.collectionIconButton}
                                                onClick={() => {
                                                    setEditedCollectionName(activeCollection?.name ?? '');
                                                    setShowRenameModal(true);
                                                }}
                                            >
                                                <img src={editIcon} alt="Edytuj kolekcję" />
                                            </button>

                                            <button
                                                className={styles.collectionIconButton}
                                                onClick={() => setShowDeleteModal(true)}
                                            >
                                                <img src={deleteIcon} alt="Usuń kolekcję" />
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className={styles.collectionIconButton}
                                        onClick={() => setShowPrivacyModal(true)}
                                    >
                                        <img
                                            src={(activeCollection?.isPublic ?? true) ? eyeOnIcon : eyeOffIcon}
                                            alt="Widoczność kolekcji"
                                        />
                                    </button>

                                    <button
                                        className={styles.collectionIconButton}
                                        onClick={copyCollectionLink}
                                    >
                                        <img src={linkIcon} alt="Kopiuj link" />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.dashboardGamesGrid}>
                                <button className={styles.addGameTile} onClick={handleAddGame}>
                                    <img src={addIcon} alt="add" />
                                    <span>dodaj kolejną grę</span>
                                </button>

                                {visibleGames.map((game) => {
                                    const imageUrl = getGameImageUrl(game);
                                    const isFavorite = getFavoriteGameIds().includes(game.gameId);

                                    return (
                                        <article
                                            key={`${game.collectionId}-${game.gameId}`}
                                            className={styles.dashboardGameCard}
                                        >
                                            <div className={styles.dashboardGameImage}>
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={game.title} />
                                                ) : (
                                                    <div className={styles.dashboardGamePlaceholder}>
                                                        Brak obrazu
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.dashboardGameInfo}>
                                                <div className={styles.gameTitleRow}>
                                                    <h2>{game.title}</h2>

                                                    {isFavorite && (
                                                        <img
                                                            src={starIcon}
                                                            alt="Ulubiona gra"
                                                            className={styles.favoriteStar}
                                                        />
                                                    )}
                                                </div>

                                                <p className={styles.gameMeta}>
                                                    {game.genreName || 'Brak gatunku'} · {game.platformName || 'Brak platformy'}
                                                </p>

                                                <p className={styles.gameDate}>
                                                    Dodano: {game.addedAt ? formatDate(game.addedAt) : 'Brak daty'}
                                                </p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Poprzednia
                                    </button>

                                    <span>
                                        {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Następna
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            {activeCustomCollectionId === null ? (
                                <>
                                    <h2>{activeEmptyState.title}</h2>
                                    <p>{activeEmptyState.description}</p>

                                    <button className={styles.addGameButton} onClick={handleAddGame}>
                                        <img src={addIcon} alt="add" />
                                        {activeEmptyState.button}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h2>
                                        Kolekcja {activeCustomCollection?.name} jest jeszcze pusta.
                                    </h2>

                                    <p>Dodaj pierwszą grę do tej kolekcji, aby zacząć ją budować.</p>

                                    <button className={styles.addGameButton} onClick={handleAddGame}>
                                        <img src={addIcon} alt="add" />
                                        dodaj grę do kolekcji
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {libraryStats && (
                    <section className={styles.statsSection}>
                        <h2>Twoje statystyki</h2>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <p>Posiadasz następującą liczbę gier w swojej bibliotece:</p>
                                <strong>{libraryStats.totalGames}</strong>
                            </div>

                            <div className={styles.statCard}>
                                <p>Liczba gier z podziałem na kategorie:</p>

                                <div
                                    className={styles.donutChart}
                                    style={{ background: `conic-gradient(${getChartGradient(libraryStats.gamesByGenre)})` }}
                                >
                                    <div className={styles.donutHole}></div>
                                </div>

                            <div className={styles.chartLegend}>
                                    {libraryStats.gamesByGenre
                                        .filter((item) => item.value > 0)
                                        .map((item, index) => (
                                            <div key={item.label} className={styles.legendItem}>
                                        <span
                                            className={styles.legendColor}
                                            style={{ background: chartColors[index % chartColors.length] }}
                                        />
                                        <span>{item.label}: {item.value}</span>
                                    </div>

                                ))}
                            </div>
                            </div>
                            <div className={styles.statCard}>
                                <p>Liczba gier z podziałem na kolekcje:</p>

                                <div
                                    className={styles.donutChart}
                                    style={{ background: `conic-gradient(${getChartGradient(libraryStats.gamesByCollection)})` }}
                                >
                                    <div className={styles.donutHole}></div>
                                </div>
                            <div className={styles.chartLegend}>
                                    {libraryStats.gamesByCollection
                                        .filter((item) => item.value > 0)
                                        .map((item, index) => (
                                            <div key={item.label} className={styles.legendItem}>
                                        <span
                                            className={styles.legendColor}
                                            style={{ background: chartColors[index % chartColors.length] }}
                                        />
                                        <span>{item.label}: {item.value}</span>
                                    </div>
                                ))}
                                    </div>
                                </div>
                        </div>
                    </section>
                )}
            </section>

            

            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Nowa kolekcja</h2>

                        <input
                            type="text"
                            placeholder="Nazwa kolekcji"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                        />

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowCreateModal(false)}>Anuluj</button>
                            <button onClick={createCollection}>Zapisz</button>
                        </div>
                    </div>
                </div>
            )}

            {showRenameModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Zmień nazwę kolekcji</h2>

                        <input
                            type="text"
                            placeholder="Nowa nazwa kolekcji"
                            value={editedCollectionName}
                            onChange={(e) => setEditedCollectionName(e.target.value)}
                        />

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowRenameModal(false)}>Anuluj</button>
                            <button onClick={updateCollectionName}>Zapisz</button>
                        </div>
                    </div>
                </div>
            )}

            {showPrivacyModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Zmień widoczność kolekcji</h2>

                        <p className={styles.modalText}>
                            Czy na pewno chcesz ustawić kolekcję {activeCollection?.name} jako {(activeCollection?.isPublic ?? true) ? 'prywatną' : 'publiczną'}?
                        </p>

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowPrivacyModal(false)}>Anuluj</button>
                            <button onClick={updateCollectionPrivacy}>Zapisz</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Usuń kolekcję</h2>

                        <p className={styles.modalText}>
                            Czy na pewno chcesz usunąć kolekcję {activeCustomCollection?.name}?
                        </p>

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowDeleteModal(false)}>Anuluj</button>
                            <button className={styles.dangerButton} onClick={deleteCollection}>Usuń</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}