import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.css';
import logo from '@/assets/logo.svg';
import arrow from '@/assets/arrow-right-black.svg';


export default function AdminPage() {
    const navigate = useNavigate();

    return (
        <main className={styles.page}>
            <img src={logo} alt="GameShelf" className={styles.logo} />

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

                <div className={styles.buttons}>
                    <button className={styles.adminButton} onClick={() => navigate('/logs')}>
                        Logi systemowe
                        <img src={arrow} alt="" width={25} />
                    </button>
                    <button className={styles.adminButton} onClick={() => navigate('/admin-games')}>
                        Gry
                        <img src={arrow} alt="" width={25} />
                    </button>
                    <button className={styles.adminButton} onClick={() => navigate('/users')}>
                        Użytkownicy
                        <img src={arrow} alt="" width={25} />
                    </button>
                </div>
            </section>
        </main>
    );
}