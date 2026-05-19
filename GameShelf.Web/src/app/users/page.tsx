import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Users.module.css';

type Role = {
    id: string;
    name: string;
    normalizedName: string;
    concurrencyStamp: string;
};

type User = {
    userId: string;
    userName: string;
    email: string;
    avatarUrl: string;
    bio: string;
    roleId: string;
    roleName: string;
    isLocked: boolean;
    availableRoles: Role[];
};

type UsersResponse = {
    data: User[];
};

export default function UsersPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/adminPanel/users/get-all-users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    draw: 1,
                    start: 0,
                    length: 100,
                    searchValue: '',
                    orderColumn: 0,
                    orderDir: 'asc',
                    extraFilters: {
                        additionalProp1: '',
                        additionalProp2: '',
                        additionalProp3: ''
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Nie udało się pobrać użytkowników.');
            }

            const data = await response.json() as UsersResponse;

            setUsers(data.data ?? []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setLoading(false);
        }
    };

    const lockUser = async (userId: string) => {
        await changeUserLockStatus(userId, true);
    };

    const unlockUser = async (userId: string) => {
        await changeUserLockStatus(userId, false);
    };

    const changeUserLockStatus = async (userId: string, shouldLock: boolean) => {
        try {
            setError('');
            setSuccessMessage('');

            const token = localStorage.getItem('authToken');

            const endpoint = shouldLock
                ? `/api/adminPanel/users/lock-user/${userId}`
                : `/api/adminPanel/users/unlock-user/${userId}`;

            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(shouldLock ? 'Nie udało się zablokować użytkownika.' : 'Nie udało się odblokować użytkownika.');
            }

            setSuccessMessage(shouldLock ? 'Użytkownik został zablokowany.' : 'Użytkownik został odblokowany.');
            await loadUsers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <div className={styles.header}>
                    <div>
                        <h1>Użytkownicy</h1>
                        <p>Lista kont zarejestrowanych w systemie.</p>
                    </div>

                    <button onClick={() => navigate('/admin')}>
                        Wróć
                    </button>
                </div>

                {successMessage && <div className={styles.success}>{successMessage}</div>}

                {loading && <div className={styles.state}>Ładowanie użytkowników...</div>}

                {!loading && error && <div className={styles.error}>{error}</div>}

                {!loading && !error && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>Email</th>
                                    <th>Rola</th>
                                    <th>Status</th>
                                    <th>Bio</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.userId}>
                                        <td>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar}>
                                                    {user.avatarUrl ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL}${user.avatarUrl}`}
                                                            alt={user.userName}
                                                        />
                                                    ) : (
                                                        <span>{user.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                                                    )}
                                                </div>

                                                <div>
                                                    <strong>{user.userName || '-'}</strong>
                                                    <p>{user.userId}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{user.email || '-'}</td>

                                        <td>
                                            <span className={styles.roleBadge}>
                                                {user.roleName || '-'}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={user.isLocked ? styles.lockedBadge : styles.activeBadge}>
                                                {user.isLocked ? 'Zablokowany' : 'Aktywny'}
                                            </span>
                                        </td>

                                        <td className={styles.bio}>
                                            {user.bio || '-'}
                                        </td>

                                        <td>
                                            <div className={styles.actions}>
                                                {user.isLocked ? (
                                                    <button
                                                        className={styles.unlockButton}
                                                        onClick={() => unlockUser(user.userId)}
                                                    >
                                                        Odblokuj
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={styles.lockButton}
                                                        onClick={() => lockUser(user.userId)}
                                                    >
                                                        Zablokuj
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {users.length === 0 && (
                            <div className={styles.empty}>
                                Brak użytkowników do wyświetlenia.
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}