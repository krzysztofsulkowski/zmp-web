import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.css';

export default function AdminPage() {
    const navigate = useNavigate();

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <h1>Panel administratora</h1>

                <p>
                    Zarządzaj aplikacją GameShelf oraz monitoruj działanie systemu.
                </p>

                <div className={styles.buttons}>
                    <button
                        className={styles.adminButton}
                        onClick={() => navigate('/log')}
                    >
                        Logi systemowe
                    </button>

                    <button
                        className={styles.adminButton}
                        onClick={() => navigate('/games')}
                    >
                        Gry
                    </button>

                    <button
                        className={styles.adminButton}
                        onClick={() => navigate('/users')}
                    >
                        Użytkownicy
                    </button>
                </div>
            </section>
        </main>
    );
}