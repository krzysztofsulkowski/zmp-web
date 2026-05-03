import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Dashboard.module.css";
import logo from "@/assets/logo.svg";
import addIcon from '@/assets/add.svg';
import arrowLeft from '@/assets/arrow-left.svg';
import arrowRight from '@/assets/arrow-right.svg';

type CollectionTab = 'library' | 'favorites' | 'planned' | 'wishlist' | 'playing' | 'completed' | 'abandoned';

type CustomCollection = {
    id: number;
    name: string;
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
    const [customCollections, setCustomCollections] = useState<CustomCollection[]>([]);
    const [activeCustomCollectionId, setActiveCustomCollectionId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    const activeEmptyState = emptyStates[activeTab];

    const scrollTabs = (direction: 'left' | 'right') => {
        if (!tabsRef.current) {
            return;
        }

        tabsRef.current.scrollBy({
            left: direction === 'left' ? -220 : 220,
            behavior: 'smooth'
        });
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

        const collections = Array.isArray(data)
            ? data
            : Array.isArray(data.data)
                ? data.data
                : [];

        const customOnly = collections.filter(
            (collection: CustomCollection) => !defaultCollectionNames.includes(collection.name)
        );

        setCustomCollections(customOnly);
    };

    useEffect(() => {
        loadCollections().catch((err) => console.error(err));
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

            const createdCollection = await response.json();
            const createdId = createdCollection.id ?? createdCollection.data?.id;

            await loadCollections();

            if (typeof createdId === 'number') {
                setActiveCustomCollectionId(createdId);
            }

            setShowModal(false);
            setNewCollectionName('');
        } catch (err) {
            console.error(err);
        }
    };

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
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}

                            {customCollections.map((collection) => (
                                <button
                                    key={collection.id}
                                    className={activeCustomCollectionId === collection.id ? styles.activeTab : ''}
                                    onClick={() => setActiveCustomCollectionId(collection.id)}
                                >
                                    {collection.name}
                                </button>
                            ))}

                            <button className={styles.addTab} onClick={() => setShowModal(true)}>
                                <img src={addIcon} alt="add" />
                            </button>
                        </div>

                        <button className={styles.tabsArrow} onClick={() => scrollTabs('right')}>
                            <img src={arrowRight} alt="scroll right" />
                        </button>
                    </div>

                    <div className={styles.emptyState}>
                        {activeCustomCollectionId === null ? (
                            <>
                                <h2>{activeEmptyState.title}</h2>
                                <p>{activeEmptyState.description}</p>

                                <button className={styles.addGameButton}>
                                    <img src={addIcon} alt="add" />
                                    {activeEmptyState.button}
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>
                                    Kolekcja {customCollections.find((collection) => collection.id === activeCustomCollectionId)?.name} jest jeszcze pusta.
                                </h2>

                                <p>Dodaj pierwszą grę do tej kolekcji, aby zacząć ją budować.</p>

                                <button className={styles.addGameButton}>
                                    <img src={addIcon} alt="add" />
                                    dodaj grę do kolekcji
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {showModal && (
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
                            <button onClick={() => setShowModal(false)}>Anuluj</button>
                            <button onClick={createCollection}>Zapisz</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}