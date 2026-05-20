import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.css';
import logo from '@/assets/logo.svg';

export default function AdminPage() {
    const navigate = useNavigate();

    return (
        <main className={styles.page}>
            <img
                src={logo}
                alt="GameShelf"
                className={styles.logo}
            />
            <button
                className={styles.logoutButton}
                onClick={() => {
                    localStorage.removeItem('authToken');
                    navigate('/login', { replace: true });
                }}
            >
                Wyloguj się
            </button>

            <section className={styles.card}>
                <h1>Panel administratora</h1>

                <p>
                    Jeśli widzisz tę stronę, oznacza to, że konto ma rolę administratora.
                </p>

                <div className={styles.buttons}>
                    <button onClick={() => navigate('/logs')}>
                        Logi systemowe
                    </button>

                    <button onClick={() => navigate('/admin-games')}>
                        Gry
                    </button>

                    <button onClick={() => navigate('/users')}>
                        Użytkownicy
                    </button>
                </div>
            </section>
        </main>
    );
}