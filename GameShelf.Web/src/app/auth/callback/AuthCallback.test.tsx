import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from './page';

function makeJwt(payload: object): string {
    const encode = (obj: object) =>
        btoa(JSON.stringify(obj))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fakesig`;
}

function renderCallback(initialEntry: string) {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
                <Route path="/admin" element={<div>Admin page</div>} />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('AuthCallback', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('zapisuje poprawny token użytkownika i przechodzi na dashboard', async () => {
        const token = makeJwt({
            email: 'user@example.com',
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: 'User',
        });

        renderCallback(`/auth-callback?token=${token}`);

        await waitFor(() => {
            expect(screen.getByText('Dashboard page')).toBeInTheDocument();
        });

        expect(localStorage.getItem('authToken')).toBe(token);
    });

    it('zapisuje poprawny token administratora i przechodzi do panelu admina', async () => {
        const token = makeJwt({
            email: 'admin@example.com',
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: 'Administrator',
        });

        renderCallback(`/auth-callback?token=${token}`);

        await waitFor(() => {
            expect(screen.getByText('Admin page')).toBeInTheDocument();
        });

        expect(localStorage.getItem('authToken')).toBe(token);
    });

    it('przekierowuje do logowania, gdy tokenu brakuje', async () => {
        renderCallback('/auth-callback');

        await waitFor(() => {
            expect(screen.getByText('Login page')).toBeInTheDocument();
        });

        expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('przekierowuje do logowania, gdy token jest nieważny', async () => {
        const expiredToken = makeJwt({
            email: 'user@example.com',
            exp: Math.floor(Date.now() / 1000) - 3600,
            role: 'User',
        });

        renderCallback(`/auth-callback?token=${expiredToken}`);

        await waitFor(() => {
            expect(screen.getByText('Login page')).toBeInTheDocument();
        });

        expect(localStorage.getItem('authToken')).toBeNull();
    });
});
