import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Dashboard.module.css";
import logo from "@/assets/logo.svg";
import addIcon from '@/assets/add.svg';

type CollectionTab = 'library' | 'favorites' | 'planned' | 'wishlist' | 'playing' | 'completed' | 'abandoned' | 'newCollection';
const tabs: { key: CollectionTab; label: string }[] = [
    { key: 'library', label: 'Biblioteka' },
    { key: 'favorites', label: 'Ulubione' },
    { key: 'planned', label: 'Planowane' },
    { key: 'wishlist', label: 'Lista życzeń' },
    { key: 'playing', label: 'W trakcie' },
    { key: 'completed', label: 'Ukończone' },
    { key: 'abandoned', label: 'Porzucone' }
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
    },
    newCollection: {
        title: 'Stwórz własną kolekcję i uporządkuj gry dokładnie tak, jak lubisz.',
        description: 'Nadaj kolekcji nazwę i zacznij dodawać do niej wybrane tytuły.',
        button: 'utwórz nową kolekcję'
    }

};

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<CollectionTab>('library');

    const activeEmptyState = emptyStates[activeTab];

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
                    <div className={styles.tabs}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={activeTab === tab.key ? styles.activeTab : ''}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}

                        <button
                            className={activeTab === 'newCollection' ? `${styles.addTab} ${styles.activeAddTab}` : styles.addTab}
                            onClick={() => setActiveTab('newCollection')}
                        >
                            <img src={addIcon} alt="add" />
                        </button>
                    </div>

                    <div className={styles.emptyState}>
                        <h2>{activeEmptyState.title}</h2>

                        <p>{activeEmptyState.description}</p>

                        <button className={styles.addGameButton}>
                            <img src={addIcon} alt="add" />
                            {activeEmptyState.button}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}