import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Faq.module.css';
import { Navbar } from '@/components/Navbar/Navbar';

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

    return (
        <main className={styles.page}>
            <Navbar activePage="faq" />

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