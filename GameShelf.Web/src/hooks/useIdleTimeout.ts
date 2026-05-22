import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const EVENTS = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
];

export function useIdleTimeout() {
    const navigate = useNavigate();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        navigate('/login');
    }, [navigate]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS);
    }, [logout]);

    useEffect(() => {
        resetTimer();

        EVENTS.forEach((event) => window.addEventListener(event, resetTimer));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
        };
    }, [resetTimer]);
}