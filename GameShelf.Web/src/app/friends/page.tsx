import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Friends.module.css';
import logo from '@/assets/logo.svg';

type UserProfile = {
    avatarUrl: string;
};

type FriendUser = {
    id: string;
    userId?: string;
    friendId?: string;
    username?: string;
    userName?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
};

type SearchResponse = {
    data?: FriendUser[];
};

export default function FriendsPage() {
    const navigate = useNavigate();

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');

    const [searchValue, setSearchValue] = useState('');
    const [emailValue, setEmailValue] = useState('');
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendUser[]>([]);

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const getAvatarUrl = (url?: string) => {
        if (!url) {
            return '';
        }

        if (url.startsWith('http')) {
            return url;
        }

        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const getUserName = (user: FriendUser) => {
        return user.userName ?? user.username ?? 'Nieznany użytkownik';
    };

    const getUserId = (user: FriendUser) => {
        return user.userId ?? user.friendId ?? user.id;
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');

        return {
            Authorization: `Bearer ${token}`
        };
    };

    const loadUserAvatar = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/authentication/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json() as UserProfile;

        setAvatarUrl(getAvatarUrl(data.avatarUrl));
    };

    const loadFriends = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/my-friends`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setFriends(Array.isArray(data) ? data : data.data ?? []);
    };

    const loadPendingRequests = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/pending-requests`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setPendingRequests(Array.isArray(data) ? data : data.data ?? []);
    };

    const searchUsers = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsLoading(true);
            setMessage('');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    draw: 1,
                    start: 0,
                    length: 20,
                    searchValue,
                    orderColumn: 0,
                    orderDir: 'asc',
                    extraFilters: {}
                })
            });

            if (!response.ok) {
                throw new Error('Nie udało się wyszukać użytkowników.');
            }

            const data = await response.json() as SearchResponse | FriendUser[];

            setSearchResults(Array.isArray(data) ? data : data.data ?? []);
        } catch (error) {
            console.error(error);
            setMessage('Nie udało się wyszukać użytkowników.');
        } finally {
            setIsLoading(false);
        }
    };

    const addByUsername = async (username: string) => {
        try {
            setMessage('');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/add-by-username/${username}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Nie udało się wysłać zaproszenia.');
            }

            setMessage('Zaproszenie zostało wysłane.');
        } catch (error) {
            console.error(error);
            setMessage('Nie udało się wysłać zaproszenia.');
        }
    };

    const sendEmailInvite = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setMessage('');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/send-invite?email=${encodeURIComponent(emailValue)}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Nie udało się wysłać zaproszenia e-mail.');
            }

            setEmailValue('');
            setMessage('Zaproszenie e-mail zostało wysłane.');
        } catch (error) {
            console.error(error);
            setMessage('Nie udało się wysłać zaproszenia e-mail.');
        }
    };

    const acceptRequest = async (requesterId: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/accept/${requesterId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadPendingRequests();
            await loadFriends();
        }
    };

    const rejectOrRemove = async (friendId: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/reject-or-remove/${friendId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadPendingRequests();
            await loadFriends();
        }
    };

    useEffect(() => {
        loadUserAvatar().catch((error) => console.error(error));
        loadFriends().catch((error) => console.error(error));
        loadPendingRequests().catch((error) => console.error(error));
    }, []);

    return (
        <main className={styles.page}>
            <nav className={styles.navbar}>
                <img src={logo} alt="GameShelf" className={styles.logo} />

                <div className={styles.navLinks}>
                    <button onClick={() => navigate('/dashboard')}>STRONA GŁÓWNA</button>
                    <button onClick={() => navigate('/community')}>SPOŁECZNOŚĆ</button>
                    <button className={styles.activeNav}>ZNAJOMI</button>
                    <button onClick={() => navigate('/faq')}>FAQ</button>
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
                            <button onClick={() => navigate('/profile')}>Ustawienia</button>
                            <button onClick={handleLogout}>Wyloguj się</button>
                        </div>
                    )}
                </div>
            </nav>

            <section className={styles.content}>
                <h1>Znajomi</h1>

                <p className={styles.subtitle}>
                    Wyszukuj użytkowników, wysyłaj zaproszenia i sprawdzaj kolekcje swoich znajomych.
                </p>

                {message && <p className={styles.message}>{message}</p>}

                <div className={styles.formsGrid}>
                    <form className={styles.formCard} onSubmit={searchUsers}>
                        <h2>Znajdź użytkownika</h2>

                        <div className={styles.inputRow}>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="Wpisz nazwę użytkownika"
                            />

                            <button type="submit" disabled={isLoading}>
                                Szukaj
                            </button>
                        </div>
                    </form>

                    <form className={styles.formCard} onSubmit={sendEmailInvite}>
                        <h2>Zaproś e-mailem</h2>

                        <div className={styles.inputRow}>
                            <input
                                type="email"
                                value={emailValue}
                                onChange={(event) => setEmailValue(event.target.value)}
                                placeholder="Adres e-mail"
                            />

                            <button type="submit">
                                Wyślij
                            </button>
                        </div>
                    </form>
                </div>

                <div className={styles.grid}>
                    <section className={styles.card}>
                        <h2>Wyniki wyszukiwania</h2>

                        {searchResults.length > 0 ? (
                            <div className={styles.userList}>
                                {searchResults.map((user) => (
                                    <article className={styles.userItem} key={getUserId(user)}>
                                        <div className={styles.userInfo}>
                                            <div className={styles.userAvatar}>
                                                {getAvatarUrl(user.avatarUrl) ? (
                                                    <img src={getAvatarUrl(user.avatarUrl)} alt={getUserName(user)} />
                                                ) : (
                                                    <span>{getUserName(user).charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>

                                            <div>
                                                <h3>{getUserName(user)}</h3>
                                                {user.email && <p>{user.email}</p>}
                                            </div>
                                        </div>

                                        <button onClick={() => addByUsername(getUserName(user))}>
                                            Dodaj
                                        </button>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyText}>Brak wyników wyszukiwania.</p>
                        )}
                    </section>

                    <section className={styles.card}>
                        <h2>Zaproszenia</h2>

                        {pendingRequests.length > 0 ? (
                            <div className={styles.userList}>
                                {pendingRequests.map((request) => (
                                    <article className={styles.userItem} key={getUserId(request)}>
                                        <div className={styles.userInfo}>
                                            <div className={styles.userAvatar}>
                                                {getAvatarUrl(request.avatarUrl) ? (
                                                    <img src={getAvatarUrl(request.avatarUrl)} alt={getUserName(request)} />
                                                ) : (
                                                    <span>{getUserName(request).charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>

                                            <div>
                                                <h3>{getUserName(request)}</h3>
                                                {request.email && <p>{request.email}</p>}
                                            </div>
                                        </div>

                                        <div className={styles.actions}>
                                            <button onClick={() => acceptRequest(getUserId(request))}>
                                                Akceptuj
                                            </button>

                                            <button
                                                className={styles.secondaryButton}
                                                onClick={() => rejectOrRemove(getUserId(request))}
                                            >
                                                Odrzuć
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyText}>Nie masz oczekujących zaproszeń.</p>
                        )}
                    </section>

                    <section className={styles.cardWide}>
                        <h2>Moi znajomi</h2>

                        {friends.length > 0 ? (
                            <div className={styles.friendsGrid}>
                                {friends.map((friend) => (
                                    <article className={styles.friendCard} key={getUserId(friend)}>
                                        <div className={styles.userAvatarLarge}>
                                            {getAvatarUrl(friend.avatarUrl) ? (
                                                <img src={getAvatarUrl(friend.avatarUrl)} alt={getUserName(friend)} />
                                            ) : (
                                                <span>{getUserName(friend).charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>

                                        <h3>{getUserName(friend)}</h3>

                                        {friend.bio && <p>{friend.bio}</p>}

                                        <div className={styles.friendActions}>
                                            <button onClick={() => navigate(`/friends/${getUserId(friend)}`)}>
                                                Kolekcje
                                            </button>

                                            <button
                                                className={styles.secondaryButton}
                                                onClick={() => rejectOrRemove(getUserId(friend))}
                                            >
                                                Usuń
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyText}>Nie masz jeszcze dodanych znajomych.</p>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}