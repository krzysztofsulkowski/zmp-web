import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './About.module.css';
import { Navbar } from '@/components/Navbar/Navbar';

type UserProfile = {
    avatarUrl: string;
};

export default function AboutPage() {
    const navigate = useNavigate();

    return (
        <main className={styles.page}>
            <Navbar activePage="about" />

            <section className={styles.content}>
                <h1>O GameShelf</h1>

                <p className={styles.subtitle}>
                    GameShelf powstał z myślą o graczach, którzy chcą mieć wszystkie swoje gry
                    w jednym miejscu. Niezależnie od platformy możesz tworzyć własne kolekcje,
                    organizować bibliotekę i wracać do ulubionych tytułów bez chaosu.
                </p>

                <div className={styles.aboutBox}>
                    <article className={styles.aboutCard}>
                        <h2>Nasza wizja</h2>

                        <p>
                            Chcemy stworzyć wygodne miejsce do organizowania gier i dzielenia się
                            nimi ze znajomymi. GameShelf łączy prostotę, nowoczesny wygląd i funkcje,
                            które pomagają utrzymać porządek w bibliotece.
                        </p>
                    </article>

                    <article className={styles.aboutCard}>
                        <h2>Dostępność wszędzie</h2>

                        <p>
                            Aplikacja działa na różnych urządzeniach — w przeglądarce, na desktopie
                            i telefonie. Dzięki temu możesz mieć dostęp do swojej kolekcji zawsze,
                            kiedy tego potrzebujesz.
                        </p>
                    </article>

                    <article className={styles.aboutCard}>
                        <h2>Dla graczy</h2>

                        <p>
                            GameShelf został zaprojektowany z myślą o osobach, które grają regularnie
                            i chcą lepiej zarządzać swoimi tytułami, planami zakupowymi oraz ulubionymi
                            seriami.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    );
}