import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';
import { Navbar } from '@/components/Navbar/Navbar';

type UserProfile = {
    userId: string;
    userName: string;
    email: string;
    avatarUrl: string;
    bio: string;
    roleId: string;
    roleName: string;
    isLocked: boolean;
};

export default function ProfilePage() {
    const navigate = useNavigate();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const getAvatarUrl = (url: string) => {
        if (!url) {
            return '';
        }

        if (url.startsWith('http')) {
            return url;
        }

        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const loadProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/authentication/me`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać profilu');
            }

            const data = await response.json() as UserProfile;
            const resolvedAvatarUrl = getAvatarUrl(data.avatarUrl ?? '');

            setUser(data);
            setUsername(data.userName ?? '');
            setBio(data.bio ?? '');
            setPreviewAvatar(resolvedAvatarUrl);
        } catch (error) {
            console.error(error);
            setMessage('Nie udało się pobrać danych profilu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const localPreviewUrl = URL.createObjectURL(file);

        setAvatar(file);
        setPreviewAvatar(localPreviewUrl);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsSaving(true);
            setMessage('');

            const token = localStorage.getItem('authToken');
            const formData = new FormData();

            formData.append('UserName', username);
            formData.append('Bio', bio);

            if (avatar) {
                formData.append('Avatar', avatar);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/authentication/update-profile`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                const backendMessage = errorData.detail ?? 'Nie udało się zapisać zmian';
                throw new Error(backendMessage);
            }

            setMessage('Profil został zaktualizowany.');
            setAvatar(null);
            await loadProfile();
        } catch (error) {
            console.error(error);

            if (error instanceof Error) {
                setMessage(error.message);
                return;
            }

            setMessage('Nie udało się zapisać zmian.');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    return (
        <main className={styles.page}>
            <Navbar />

            <section className={styles.content}>
                <h1>Ustawienia profilu</h1>

                {isLoading ? (
                    <p className={styles.status}>Ładowanie profilu...</p>
                ) : (
                    <form className={styles.profileCard} onSubmit={handleSubmit}>
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarPreview}>
                                {previewAvatar ? (
                                    <img src={previewAvatar} alt="Avatar użytkownika" />
                                ) : (
                                    <span>{username ? username.charAt(0).toUpperCase() : '?'}</span>
                                )}
                            </div>

                            <label className={styles.avatarUpload}>
                                Zmień avatar
                                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Nazwa użytkownika</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Wpisz nazwę użytkownika"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input type="email" value={user?.email ?? ''} disabled />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Bio</label>
                            <textarea
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                                placeholder="Napisz coś o sobie"
                            />
                        </div>

                        {message && <p className={styles.message}>{message}</p>}

                        <button className={styles.saveButton} type="submit" disabled={isSaving}>
                            {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}