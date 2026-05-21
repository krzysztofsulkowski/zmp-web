import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Friends.module.css';
import { Navbar } from '@/components/Navbar/Navbar';

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

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('friends');

    const [searchValue, setSearchValue] = useState('');
    const [emailValue, setEmailValue] = useState('');
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendUser[]>([]);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [isLoading, setIsLoading] = useState(false);

    const getUserName = (user: FriendUser) =>
        user.userName ?? user.username ?? 'Nieznany użytkownik';

    const getUserId = (user: FriendUser) =>
        user.friendId ?? user.userId ?? user.id;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return { Authorization: `Bearer ${token}` };
    };

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3500);
    };

    const getAvatarUrl = (url?: string): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const loadFriends = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/my-friends`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) return;
        const data = await response.json();
        console.log('friends raw:', JSON.stringify(data, null, 2));
        setFriends(Array.isArray(data) ? data : data.data ?? []);
    };

    const loadPendingRequests = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/pending-requests`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) return;
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
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ draw: 1, start: 0, length: 20, searchValue, orderColumn: 0, orderDir: 'asc', extraFilters: {} })
            });
            if (!response.ok) throw new Error();
            const data = await response.json() as SearchResponse | FriendUser[];
            const raw: FriendUser[] = Array.isArray(data) ? data : data.data ?? [];
            const friendIds = new Set(friends.map((f) => getUserId(f)));
            const query = searchValue.toLowerCase();
            const filtered = raw.filter((u) => {
                if (friendIds.has(getUserId(u))) return false;
                const name = getUserName(u).toLowerCase();
                return name.includes(query);
            });
            setSearchResults(filtered);
        } catch {
            showMessage('Nie udało się wyszukać użytkowników.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const addByUsername = async (username: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/add-by-username/${username}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error();
            showMessage('Zaproszenie zostało wysłane.');
        } catch {
            showMessage('Nie udało się wysłać zaproszenia.', 'error');
        }
    };

    const sendEmailInvite = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/send-invite?email=${encodeURIComponent(emailValue)}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error();
            setEmailValue('');
            showMessage('Zaproszenie e-mail zostało wysłane.');
        } catch {
            showMessage('Nie udało się wysłać zaproszenia e-mail.', 'error');
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
            showMessage('Zaproszenie zaakceptowane.');
        }
    };

    const rejectOrRemove = async (friendId: string, isFriend = false) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/reject-or-remove/${friendId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error();
            await loadPendingRequests();
            await loadFriends();
            showMessage(isFriend ? 'Znajomy został usunięty.' : 'Zaproszenie odrzucone.');
        } catch {
            showMessage(isFriend ? 'Nie udało się usunąć znajomego.' : 'Nie udało się odrzucić zaproszenia.', 'error');
        }
    };

    useEffect(() => {
        loadFriends().catch(console.error);
        loadPendingRequests().catch(console.error);
    }, []);

    return (
        <main className={styles.page}>
            <Navbar activePage="friends" />

            <section className={styles.content}>
                <h1>Znajomi</h1>

                <div className={styles.tabsWrapper}>
                    <button
                        className={activeTab === 'friends' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('friends')}
                    >
                        Moi znajomi
                        {friends.length > 0 && <span className={styles.badge}>{friends.length}</span>}
                    </button>
                    <button
                        className={activeTab === 'requests' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('requests')}
                    >
                        Zaproszenia
                        {pendingRequests.length > 0 && (
                            <span className={`${styles.badge} ${styles.badgeAlert}`}>{pendingRequests.length}</span>
                        )}
                    </button>
                    <button
                        className={activeTab === 'search' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('search')}
                    >
                        Znajdź użytkownika
                    </button>
                </div>

                {message && (
                    <p className={messageType === 'error' ? styles.messageError : styles.messageSuccess}>
                        {message}
                    </p>
                )}

                <div className={styles.panel}>
                    {activeTab === 'friends' && (
                        <>
                            {friends.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>Nie masz jeszcze żadnych znajomych.</p>
                                    <button className={styles.ctaButton} onClick={() => setActiveTab('search')}>
                                        Znajdź kogoś
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.friendsGrid}>
                                    {friends.map((friend) => (
                                        <article className={styles.friendCard} key={getUserId(friend)}>
                                            <div className={styles.friendAvatar}>
                                                {getAvatarUrl(friend.avatarUrl)
                                                    ? <img src={getAvatarUrl(friend.avatarUrl)} alt={getUserName(friend)} />
                                                    : <span>{getUserName(friend).charAt(0).toUpperCase()}</span>
                                                }
                                            </div>
                                            <div className={styles.friendInfo}>
                                                <h3>{getUserName(friend)}</h3>
                                                {friend.bio && <p className={styles.friendBio}>{friend.bio}</p>}
                                            </div>
                                            <div className={styles.friendActions}>
                                                <button
                                                    className={styles.primaryButton}
                                                    onClick={() => navigate(`/friends/${getUserId(friend)}`)}
                                                >
                                                    Wyświetl profil
                                                </button>
                                                <button
                                                    className={styles.ghostButton}
                                                    onClick={() => rejectOrRemove(getUserId(friend), true)}
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'requests' && (
                        <>
                            {pendingRequests.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>Brak oczekujących zaproszeń.</p>
                                </div>
                            ) : (
                                <div className={styles.requestList}>
                                    {pendingRequests.map((request) => (
                                        <article className={styles.requestItem} key={getUserId(request)}>
                                            <div className={styles.requestAvatar}>
                                                {getAvatarUrl(request.avatarUrl)
                                                    ? <img src={getAvatarUrl(request.avatarUrl)} alt={getUserName(request)} />
                                                    : <span>{getUserName(request).charAt(0).toUpperCase()}</span>
                                                }
                                            </div>
                                            <div className={styles.requestInfo}>
                                                <h3>{getUserName(request)}</h3>
                                                {request.email && <p>{request.email}</p>}
                                            </div>
                                            <div className={styles.requestActions}>
                                                <button
                                                    className={styles.primaryButton}
                                                    onClick={() => acceptRequest(getUserId(request))}
                                                >
                                                    Akceptuj
                                                </button>
                                                <button
                                                    className={styles.ghostButton}
                                                    onClick={() => rejectOrRemove(getUserId(request))}
                                                >
                                                    Odrzuć
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'search' && (
                        <div className={styles.searchTab}>
                            <div className={styles.searchForms}>
                                <form className={styles.searchForm} onSubmit={searchUsers}>
                                    <label className={styles.searchLabel}>Szukaj po nazwie użytkownika</label>
                                    <div className={styles.inputRow}>
                                        <input
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            placeholder="Wpisz nazwę użytkownika"
                                        />
                                        <button type="submit" className={styles.primaryButton} disabled={isLoading}>
                                            {isLoading ? '...' : 'Szukaj'}
                                        </button>
                                    </div>
                                </form>

                                <div className={styles.divider}>lub</div>

                                <form className={styles.searchForm} onSubmit={sendEmailInvite}>
                                    <label className={styles.searchLabel}>Zaproś przez e-mail</label>
                                    <div className={styles.inputRow}>
                                        <input
                                            type="email"
                                            value={emailValue}
                                            onChange={(e) => setEmailValue(e.target.value)}
                                            placeholder="Adres e-mail"
                                        />
                                        <button type="submit" className={styles.primaryButton}>
                                            Wyślij
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {searchResults.length > 0 && (
                                <div className={styles.searchResults}>
                                    <p className={styles.resultsLabel}>Wyniki wyszukiwania</p>
                                    <div className={styles.requestList}>
                                        {searchResults.map((user) => (
                                            <article className={styles.requestItem} key={getUserId(user)}>
                                                <div className={styles.requestAvatar}>
                                                    {getAvatarUrl(user.avatarUrl)
                                                        ? <img src={getAvatarUrl(user.avatarUrl)} alt={getUserName(user)} />
                                                        : <span>{getUserName(user).charAt(0).toUpperCase()}</span>
                                                    }
                                                </div>
                                                <div className={styles.requestInfo}>
                                                    <h3>{getUserName(user)}</h3>
                                                    {user.email && <p>{user.email}</p>}
                                                </div>
                                                <button
                                                    className={styles.primaryButton}
                                                    onClick={() => addByUsername(getUserName(user))}
                                                >
                                                    Dodaj
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}