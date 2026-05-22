import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type UserProfile = {
    avatarUrl: string;
};

export function useCurrentUser() {
    const navigate = useNavigate();
    const [avatarUrl, setAvatarUrl] = useState('');

    const getAvatarUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const loadUserAvatar = async (): Promise<void> => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/authentication/me`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) return;

        const data = await response.json() as UserProfile;
        setAvatarUrl(getAvatarUrl(data.avatarUrl ?? ''));
    };

    const handleLogout = (): void => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    useEffect(() => {
        loadUserAvatar().catch((error) => console.error(error));
    }, []);

    return { avatarUrl, handleLogout };
}