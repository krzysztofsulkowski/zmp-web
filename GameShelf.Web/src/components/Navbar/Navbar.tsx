import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './Navbar.module.css';
import logo from '@/assets/logo.svg';

export type NavPage = 'dashboard' | 'community' | 'friends' | 'faq' | 'about';

type NavbarProps = {
    activePage?: NavPage;
};

const navItems: { label: string; page: NavPage; path: string }[] = [
    { label: 'STRONA GŁÓWNA', page: 'dashboard', path: '/dashboard' },
    { label: 'SPOŁECZNOŚĆ', page: 'community', path: '/community' },
    { label: 'ZNAJOMI', page: 'friends', path: '/friends' },
    { label: 'FAQ', page: 'faq', path: '/faq' },
    { label: 'O NAS', page: 'about', path: '/about' },
];

export function Navbar({ activePage }: NavbarProps) {
    const navigate = useNavigate();
    const { avatarUrl, handleLogout } = useCurrentUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className={styles.navbar}>
            <img src={logo} alt="GameShelf" className={styles.logo} />

            <div className={styles.navLinks}>
                {navItems.map((item) => (
                    <button
                        key={item.page}
                        className={activePage === item.page ? styles.activeNav : undefined}
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className={styles.profileWrapper}>
                <button
                    className={styles.profileButton}
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Menu użytkownika"
                    aria-expanded={isMenuOpen}
                >
                    {avatarUrl && <img src={avatarUrl} alt="Avatar użytkownika" />}
                </button>

                {isMenuOpen && (
                    <div className={styles.profileMenu}>
                        <button onClick={() => { setIsMenuOpen(false); navigate('/profile'); }}>
                            Ustawienia
                        </button>
                        <button onClick={handleLogout}>
                            Wyloguj się
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}