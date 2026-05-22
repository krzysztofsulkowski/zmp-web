import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Users.module.css';
import arrowBack from '@/assets/arrow-back.svg';
import block from '@/assets/block-black.svg';
import edit from '@/assets/edit-black.svg';



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
    roleId: string;
    roleName: string;
    isLocked: boolean;
    invitationCode: string;
    availableRoles: Role[];
};

type UsersResponse = {
    data: User[];
};

type EditForm = {
    userName: string;
    email: string;
    roleId: string;
    roleName: string;
};

type ConfirmAction = {
    userId: string;
    shouldLock: boolean;
    userName: string;
};

export default function UsersPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ userName: '', email: '', roleId: '', roleName: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [brokenAvatars, setBrokenAvatars] = useState<Set<string>>(new Set());

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/adminPanel/users/get-all-users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    draw: 1, start: 0, length: 100, searchValue: '', orderColumn: 0, orderDir: 'asc',
                    extraFilters: { additionalProp1: '', additionalProp2: '', additionalProp3: '' }
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

    const loadRoles = async () => {
        try {
            setRolesLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/adminPanel/users/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error();
            const data = await response.json() as Role[];
            setAvailableRoles(data ?? []);
        } catch {
            setAvailableRoles([]);
        } finally {
            setRolesLoading(false);
        }
    };

    const confirmLockToggle = (user: User) => {
        setConfirmAction({ userId: user.userId, shouldLock: !user.isLocked, userName: user.userName });
    };

    const executeConfirmedAction = async () => {
        if (!confirmAction) return;
        await changeUserLockStatus(confirmAction.userId, confirmAction.shouldLock);
        setConfirmAction(null);
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
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(shouldLock ? 'Nie udało się zablokować użytkownika.' : 'Nie udało się odblokować użytkownika.');
            setSuccessMessage(shouldLock ? 'Użytkownik został zablokowany.' : 'Użytkownik został odblokowany.');
            await loadUsers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        }
    };

    const openEditModal = async (user: User) => {
        setEditingUser(user);
        setEditForm({ userName: user.userName, email: user.email, roleId: user.roleId, roleName: user.roleName });
        setEditError('');
        await loadRoles();
    };

    const closeEditModal = () => { setEditingUser(null); setEditError(''); };

    const handleRoleChange = (roleId: string) => {
        const selectedRole = availableRoles.find(r => r.id === roleId);
        setEditForm(prev => ({ ...prev, roleId, roleName: selectedRole?.name ?? prev.roleName }));
    };

    const saveUserEdits = async () => {
        if (!editingUser) return;
        try {
            setEditLoading(true);
            setEditError('');
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/adminPanel/users/update-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    userId: editingUser.userId,
                    userName: editForm.userName,
                    email: editForm.email,
                    avatarUrl: editingUser.avatarUrl,
                    bio: '',
                    roleId: editForm.roleId,
                    roleName: editForm.roleName,
                    isLocked: editingUser.isLocked,
                    invitationCode: editingUser.invitationCode,
                    availableRoles: editingUser.availableRoles
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Nie udało się zaktualizować użytkownika.');
            }
            setSuccessMessage('Dane użytkownika zostały zaktualizowane.');
            closeEditModal();
            await loadUsers();
        } catch (err: unknown) {
            setEditError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleAvatarError = (userId: string) => {
        setBrokenAvatars(prev => new Set(prev).add(userId));
    };

    const resolveAvatarUrl = (avatarUrl: string) => {
        if (!avatarUrl) return null;
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
        return `${import.meta.env.VITE_API_URL}${avatarUrl}`;
    };

    useEffect(() => { loadUsers(); }, []);

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate('/admin')}>
                        <img src={arrowBack} alt="Wróć" />
                    </button>
                    <h1 className={styles.title}>Użytkownicy</h1>
                    <div className={styles.headerSpacer} />
                </div>

                {successMessage && <div className={styles.success}>{successMessage}</div>}
                {error && <div className={styles.error}>{error}</div>}
                {loading && <div className={styles.state}>Ładowanie użytkowników...</div>}

                {!loading && !error && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nazwa użytkownika</th>
                                    <th>Email</th>
                                    <th>Rola</th>
                                    <th>Status</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const avatarUrl = resolveAvatarUrl(user.avatarUrl);
                                    const showAvatar = avatarUrl && !brokenAvatars.has(user.userId);
                                    return (
                                        <tr key={user.userId}>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <div className={styles.avatar}>
                                                        {showAvatar ? (
                                                            <img src={avatarUrl} alt={user.userName} onError={() => handleAvatarError(user.userId)} />
                                                        ) : null}
                                                    </div>
                                                    <span>{user.userName || '—'}</span>
                                                </div>
                                            </td>
                                            <td className={styles.emailCell}>{user.email || '—'}</td>
                                            <td>{user.roleName || '—'}</td>
                                            <td>
                                                <span className={user.isLocked ? styles.lockedBadge : styles.activeBadge}>
                                                    {user.isLocked ? 'zablokowany' : 'aktywny'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={styles.iconBtn}
                                                        onClick={() => openEditModal(user)}
                                                        title="Edytuj"
                                                    >
                                                        <img src={edit} alt="Wróć" />
                                                    </button>
                                                    <button
                                                        className={`${styles.iconBtn} ${user.isLocked ? styles.iconBtnUnlock : styles.iconBtnLock}`}
                                                        onClick={() => confirmLockToggle(user)}
                                                        title={user.isLocked ? 'Odblokuj' : 'Zablokuj'}
                                                    >
                                                        <img src={block} alt="Wróć" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className={styles.empty}>Brak użytkowników do wyświetlenia.</div>
                        )}
                    </div>
                )}
            </section>

            {confirmAction && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h2>{confirmAction.shouldLock ? 'Zablokuj użytkownika' : 'Odblokuj użytkownika'}</h2>
                        <p>
                            Czy na pewno chcesz {confirmAction.shouldLock ? 'zablokować' : 'odblokować'} konto{' '}
                            <strong>{confirmAction.userName}</strong>?
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.btnCancel} onClick={() => setConfirmAction(null)}>Anuluj</button>
                            <button
                                className={confirmAction.shouldLock ? styles.btnDanger : styles.btnSuccess}
                                onClick={executeConfirmedAction}
                            >
                                {confirmAction.shouldLock ? 'Zablokuj' : 'Odblokuj'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Edytuj użytkownika</h2>
                            <button className={styles.closeBtn} onClick={closeEditModal}>✕</button>
                        </div>
                        {editError && <div className={styles.error}>{editError}</div>}
                        <div className={styles.formGroup}>
                            <label>Nazwa użytkownika</label>
                            <input type="text" value={editForm.userName} onChange={e => setEditForm(prev => ({ ...prev, userName: e.target.value }))} className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input type="email" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Rola</label>
                            <select value={editForm.roleId} onChange={e => handleRoleChange(e.target.value)} className={styles.input} disabled={rolesLoading}>
                                {rolesLoading && <option value="">Ładowanie ról...</option>}
                                {!rolesLoading && availableRoles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.btnCancel} onClick={closeEditModal} disabled={editLoading}>Anuluj</button>
                            <button className={styles.btnPrimary} onClick={saveUserEdits} disabled={editLoading || rolesLoading}>
                                {editLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}