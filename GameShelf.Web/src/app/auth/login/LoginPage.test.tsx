import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './page';

function makeJwt(payload: object): string {
    const encode = (obj: object) =>
        btoa(JSON.stringify(obj))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fakesig`;
}

function renderLogin(initialEntry = '/login') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
                <Route path="/admin" element={<div>Admin page</div>} />
                <Route path="/forgot-password" element={<div>Forgot password page</div>} />
                <Route path="/register" element={<div>Register page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

function getLoginInputs(container: HTMLElement) {
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    return {
        emailInput: inputs[0],
        passwordInput: inputs[1],
    };
}

describe('LoginPage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('fetch', vi.fn());
        Object.defineProperty(window, 'location', {
            value: {
                ...window.location,
                origin: 'http://localhost:5173',
                href: 'http://localhost:5173/login',
            },
            writable: true,
        });
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('wyświetla komunikat błędu po nieudanym logowaniu Google', () => {
        renderLogin('/login?error=auth_failed');
        expect(screen.getByText('Logowanie za pomocą Google nie powiodło się.')).toBeInTheDocument();
    });

    it('pozwala przełączyć widoczność hasła', async () => {
        const user = userEvent.setup();
        const { container } = renderLogin();
        const { passwordInput } = getLoginInputs(container);

        expect(passwordInput.type).toBe('password');

        await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));
        expect(passwordInput.type).toBe('text');

        await user.click(screen.getByRole('button', { name: 'Ukryj hasło' }));
        expect(passwordInput.type).toBe('password');
    });

    it('wysyła poprawne dane logowania i przekierowuje zwykłego użytkownika na dashboard', async () => {
        const user = userEvent.setup();
        const token = makeJwt({
            email: 'user@example.com',
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: 'User',
        });

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { token } }),
        } as Response);

        const { container } = renderLogin();
        const { emailInput, passwordInput } = getLoginInputs(container);

        await user.type(emailInput, 'user@example.com');
        await user.type(passwordInput, 'Password1!');
        await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/authentication/login'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'user@example.com', password: 'Password1!' }),
                })
            );
        });

        expect(localStorage.getItem('authToken')).toBe(token);
        expect(screen.getByText('Zalogowano pomyślnie!')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Dashboard page')).toBeInTheDocument();
        });
    });

    it('przekierowuje administratora na panel admina', async () => {
        const user = userEvent.setup();
        const token = makeJwt({
            email: 'admin@example.com',
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: 'Administrator',
        });

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token }),
        } as Response);

        const { container } = renderLogin();
        const { emailInput, passwordInput } = getLoginInputs(container);

        await user.type(emailInput, 'admin@example.com');
        await user.type(passwordInput, 'Password1!');
        await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

        await waitFor(() => {
            expect(localStorage.getItem('authToken')).toBe(token);
        });

        await waitFor(() => {
            expect(screen.getByText('Admin page')).toBeInTheDocument();
        });
    });

    it('pokazuje błąd, gdy API zwraca niepoprawne dane logowania', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ title: 'Unauthorized' }),
        } as Response);

        const { container } = renderLogin();
        const { emailInput, passwordInput } = getLoginInputs(container);

        await user.type(emailInput, 'bad@example.com');
        await user.type(passwordInput, 'wrong');
        await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

        expect(await screen.findByText('Nieprawidłowy adres e-mail lub hasło.')).toBeInTheDocument();
        expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('pokazuje błąd, gdy odpowiedź API nie zawiera tokenu', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: {} }),
        } as Response);

        const { container } = renderLogin();
        const { emailInput, passwordInput } = getLoginInputs(container);

        await user.type(emailInput, 'user@example.com');
        await user.type(passwordInput, 'Password1!');
        await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

        expect(await screen.findByText('Nieprawidłowy adres e-mail lub hasło.')).toBeInTheDocument();
        expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('pokazuje błąd, gdy token jest nieważny', async () => {
        const user = userEvent.setup();
        const expiredToken = makeJwt({
            email: 'user@example.com',
            exp: Math.floor(Date.now() / 1000) - 3600,
            role: 'User',
        });

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { token: expiredToken } }),
        } as Response);

        const { container } = renderLogin();
        const { emailInput, passwordInput } = getLoginInputs(container);

        await user.type(emailInput, 'user@example.com');
        await user.type(passwordInput, 'Password1!');
        await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

        expect(await screen.findByText('Nieprawidłowy token autoryzacyjny.')).toBeInTheDocument();
        expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('przekierowuje do logowania Google po kliknięciu przycisku', async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole('button', { name: 'Kontynuuj przez Google' }));

        expect(window.location.href).toContain('/api/authentication/external-login?provider=Google');
        expect(window.location.href).toContain('returnUrl=http%3A%2F%2Flocalhost%3A5173%2Fauth-callback');
    });
});
