import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Faq.module.css';
import logo from '@/assets/logo.svg';

type UserProfile = {
    avatarUrl: string;
};

const faqItems = [
    {
        question: 'Czym jest GameShelf?',
        answer: 'GameShelf to aplikacja do organizowania własnej biblioteki gier. Możesz dodawać gry do kolekcji, oznaczać ulubione tytuły i porządkować wszystko w jednym miejscu.'
    },
    {
        question: 'Czy mogę tworzyć własne kolekcje?',
        answer: 'Tak. Oprócz domyślnych kolekcji możesz tworzyć własne listy i nadawać im dowolne nazwy.'
    },
    {
        question: 'Jak dodać grę do kolekcji?',
        answer: 'Wystarczy wejść w wybraną kolekcję, kliknąć przycisk dodawania gry, wyszukać tytuł i zapisać go w odpowiedniej kolekcji.'
    },
    {
        question: 'Czy jedna gra może być w kilku kolekcjach?',
        answer: 'Tak, gra może pojawiać się w różnych kolekcjach, zależnie od tego, jak chcesz uporządkować swoją bibliotekę.'
    },
    {
        question: 'Jak działa kolekcja Ulubione?',
        answer: 'Do kolekcji Ulubione trafiają gry oznaczone przez Ciebie jako ulubione podczas dodawania gry.'
    },
    {
        question: 'Czy mogę filtrować i sortować gry?',
        answer: 'Tak. Na dashboardzie możesz filtrować gry po platformie i kategorii oraz sortować je alfabetycznie albo według daty dodania.'
    },
    {
        question: 'Czy aplikacja jest darmowa?',
        answer: 'Tak, funkcje aplikacji są dostępne za darmo.'
    },
    {
        question: 'Czy mogę korzystać z aplikacji na różnych urządzeniach?',
        answer: 'GameShelf działa jako aplikacja webowa, desktopowa i mobilna.'
    }
];

export default function FaqPage() {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
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

    useEffect(() => {
        loadUserAvatar().catch((error) => console.error(error));
    }, []);

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button onClick={() => navigate('/dashboard')}>STRONA GŁÓWNA</button>
                    <button onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
                    <button onClick={() => navigate('/friends')}>ZNAJOMI</button>
                    <button className={styles.activeNav}>FAQ</button>
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
                <h1>Najczęściej zadawane pytania</h1>

                <p className={styles.subtitle}>
                    Tutaj znajdziesz krótkie odpowiedzi na najważniejsze pytania dotyczące korzystania z GameShelf.
                </p>

                <div className={styles.faqBox}>
                    {faqItems.map((item) => (
                        <article key={item.question} className={styles.faqItem}>
                            <h2>{item.question}</h2>
                            <p>{item.answer}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}