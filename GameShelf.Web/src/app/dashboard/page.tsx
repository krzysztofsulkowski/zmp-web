import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Dashboard.module.css";
import logo from "@/assets/logo.svg";
import addIcon from '@/assets/add.svg';
import arrowLeft from '@/assets/arrow-left.svg';
import arrowRight from '@/assets/arrow-right.svg';

type CollectionTab = 'library' | 'favorites' | 'planned' | 'wishlist' | 'playing' | 'completed' | 'abandoned';

type Collection = {
    id: number;
    name: string;
    isPublic?: boolean;
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
    rating?: number;
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
        title: 'Kolekcja Ulubione to miejsce, w którym znajdziesz wszystkie gry ocenione przez Ciebie na 5 gwiazdek - Twoje absolutne top tytuły.',
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

    const [activeTab, setActiveTab] = useState<CollectionTab>('library');
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [customCollections, setCustomCollections] = useState<Collection[]>([]);
    const [collectionsWithGames, setCollectionsWithGames] = useState<CollectionWithGames[]>([]);
    const [gameImages, setGameImages] = useState<Record<number, string>>({});
    const [activeCustomCollectionId, setActiveCustomCollectionId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
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

    const getActiveDefaultCollectionId = () => {
        const activeTabData = tabs.find((tab) => tab.key === activeTab);

        if (!activeTabData) {
            return null;
        }

        const collection = allCollections.find((item) => item.name === activeTabData.label);

        return collection?.id ?? null;
    };

    const getActiveGames = () => {
        if (activeTab === 'library' && activeCustomCollectionId === null) {
            return collectionsWithGames.flatMap((collection) => collection.games);
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

        if (activeTab === 'library' && activeCustomCollectionId === null) {
            navigate('/games');
            return;
        }

        if (collectionId === null || collectionId === undefined) {
            console.error('Brak ID aktywnej kolekcji');
            return;
        }

        navigate(`/games?collectionId=${collectionId}`);
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
            setShowSettingsDropdown(false);
        } catch (err) {
            console.error(err);
        }
    };

    const activeGames = getActiveGames();

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
                    <button onClick={() => navigate('/friends')}>ZNAJOMI</button>
                    <button onClick={() => navigate('/faq')}>FAQ</button>
                    <button onClick={() => navigate('/about')}>O NAS</button>
                </div>

                <button className={styles.profileButton} onClick={() => navigate('/profile')}></button>
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
                                        setShowSettingsDropdown(false);
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
                                        setShowSettingsDropdown(false);
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

                        {activeCustomCollection && (
                            <div className={styles.collectionSettings}>
                                <button
                                    className={styles.collectionSettingsButton}
                                    onClick={() => setShowSettingsDropdown((prev) => !prev)}
                                >
                                    Ustawienia
                                </button>

                                {showSettingsDropdown && (
                                    <div className={styles.collectionSettingsDropdown}>
                                        <button
                                            onClick={() => {
                                                setEditedCollectionName(activeCustomCollection.name);
                                                setShowRenameModal(true);
                                                setShowSettingsDropdown(false);
                                            }}
                                        >
                                            Zmień nazwę kolekcji
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowPrivacyModal(true);
                                                setShowSettingsDropdown(false);
                                            }}
                                        >
                                            Ustawienia prywatności
                                        </button>

                                        <button
                                            className={styles.deleteOption}
                                            onClick={() => {
                                                setShowDeleteModal(true);
                                                setShowSettingsDropdown(false);
                                            }}
                                        >
                                            Usuń kolekcję
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {activeGames.length > 0 ? (
                        <div className={styles.dashboardGamesGrid}>
                            {activeGames.map((game) => {
                                const imageUrl = getGameImageUrl(game);

                                return (
                                    <article key={`${game.collectionId}-${game.gameId}`} className={styles.dashboardGameCard}>
                                        <div className={styles.dashboardGameImage}>
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={game.title} />
                                            ) : (
                                                <div className={styles.dashboardGamePlaceholder}>Brak obrazu</div>
                                            )}
                                        </div>

                                        <div className={styles.dashboardGameInfo}>
                                            <h2>{game.title}</h2>
                                            <p>{game.genreName || 'Brak gatunku'} · {game.platformName || 'Brak platformy'}</p>
                                            <p>Dodano: {game.addedAt ? formatDate(game.addedAt) : 'Brak daty'}</p>
                                            <p>Ocena: {game.rating ? `${game.rating}/5` : 'Brak oceny'}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
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
                        <h2>Ustawienia prywatności</h2>

                        <p className={styles.modalText}></p>

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowPrivacyModal(false)}>Zamknij</button>
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