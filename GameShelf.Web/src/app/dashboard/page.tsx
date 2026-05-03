import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import logo from '@/assets/logo.svg';

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button className={styles.navButton} onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
                    <button className={styles.navButton} onClick={() => navigate('/friends')}>ZNAJOMI</button>
                    <button className={styles.navButton} onClick={() => navigate('/faq')}>FAQ</button>
                    <button className={styles.navButton} onClick={() => navigate('/about')}>O NAS</button>
                </div>

                <button className={styles.profileButton} onClick={() => navigate('/profile')}></button>
            </nav>

            <section className={styles.content}>
                <h1>Twoje kolekcje</h1>

                <div className={styles.collectionsBox}>
                    <div className={styles.tabs}>
                        <button className={styles.activeTab}>Biblioteka</button>
                        <button>Ulubione</button>
                        <button>Planowane</button>
                        <button>Lista życzeń</button>
                        <button>W trakcie</button>
                        <button>Ukończone</button>
                        <button>Porzucone</button>
                        <button className={styles.addTab}>+</button>
                    </div>

                    <div className={styles.emptyState}>
                        <h2>
                            Biblioteka to miejsce, w którym znajdziesz wszystkie
                            swoje gry - bez podziału na kategorie.
                        </h2>

                        <p>Dodaj swoją pierwszą grę, aby rozpocząć budowanie kolekcji.</p>

                        <button className={styles.addGameButton}>
                            <span>+</span>
                            dodaj pierwszą grę
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}