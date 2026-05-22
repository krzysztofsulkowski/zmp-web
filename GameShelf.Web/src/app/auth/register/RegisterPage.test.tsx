import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from './page';

function renderRegister() {
    return render(
        <MemoryRouter initialEntries={['/register']}>
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

function getRegisterInputs(container: HTMLElement) {
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    return {
        emailInput: inputs[0],
        usernameInput: inputs[1],
        passwordInput: inputs[2],
        confirmPasswordInput: inputs[3],
    };
}

async function fillRegisterForm(user: ReturnType<typeof userEvent.setup>, container: HTMLElement, values?: Partial<{
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}>) {
    const { emailInput, usernameInput, passwordInput, confirmPasswordInput } = getRegisterInputs(container);
    await user.type(emailInput, values?.email ?? 'user@example.com');
    await user.type(usernameInput, values?.username ?? 'TestUser');
    await user.type(passwordInput, values?.password ?? 'Password1!');
    await user.type(confirmPasswordInput, values?.confirmPassword ?? 'Password1!');
}

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        Object.defineProperty(window, 'location', {
            value: {
                ...window.location,
                origin: 'http://localhost:5173',
                href: 'http://localhost:5173/register',
            },
            writable: true,
        });
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('pokazuje wymagania hasła i aktualizuje je podczas wpisywania', async () => {
        const user = userEvent.setup();
        const { container } = renderRegister();

        expect(screen.queryByText(/Min\. 8 znaków/)).not.toBeInTheDocument();

        await user.type(getRegisterInputs(container).passwordInput, 'Password1!');

        expect(screen.getByText(/Min\. 8 znaków/)).toBeInTheDocument();
        expect(screen.getByText(/Wielka litera/)).toBeInTheDocument();
        expect(screen.getByText(/Cyfra/)).toBeInTheDocument();
        expect(screen.getByText(/Znak specjalny/)).toBeInTheDocument();
    });

    it('nie wysyła formularza, gdy hasło jest za słabe', async () => {
        const user = userEvent.setup();
        const { container } = renderRegister();

        await fillRegisterForm(user, container, {
            password: 'abc',
            confirmPassword: 'abc',
        });

        await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

        expect(screen.getByText('Hasło musi zawierać min. 8 znaków, wielką literę, cyfrę i znak specjalny.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('nie wysyła formularza, gdy hasła są różne', async () => {
        const user = userEvent.setup();
        const { container } = renderRegister();

        await fillRegisterForm(user, container, {
            password: 'Password1!',
            confirmPassword: 'Password2!',
        });

        await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

        expect(screen.getByText('Hasła nie są takie same.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('nie wysyła formularza, gdy adres e-mail jest niepoprawny', async () => {
        const user = userEvent.setup();
        const { container } = renderRegister();

        await fillRegisterForm(user, container, {
            email: 'user',
        });

        fireEvent.submit(container.querySelector('form') as HTMLFormElement);

        expect(screen.getByText('Niepoprawny adres e-mail.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('wysyła poprawne dane rejestracji i przekierowuje do logowania', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        const { container } = renderRegister();

        await fillRegisterForm(user, container);
        await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/authentication/register'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'user@example.com',
                        username: 'TestUser',
                        password: 'Password1!',
                    }),
                })
            );
        });

        expect(screen.getByText('Konto zostało utworzone.')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Login page')).toBeInTheDocument();
        });
    });

    it('pokazuje błąd, gdy rejestracja w API się nie uda', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ title: 'Bad request' }),
        } as Response);

        const { container } = renderRegister();

        await fillRegisterForm(user, container);
        await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

        expect(await screen.findByText('Rejestracja nieudana. Sprawdź poprawność danych.')).toBeInTheDocument();
        expect(screen.queryByText('Konto zostało utworzone.')).not.toBeInTheDocument();
    });

    it('pozwala przełączyć widoczność obu pól hasła', async () => {
        const user = userEvent.setup();
        const { container } = renderRegister();

        const { passwordInput, confirmPasswordInput } = getRegisterInputs(container);

        expect(passwordInput.type).toBe('password');
        expect(confirmPasswordInput.type).toBe('password');

        await user.click(screen.getAllByRole('button', { name: 'Pokaż hasło' })[0]);
        await user.click(screen.getAllByRole('button', { name: 'Pokaż hasło' })[0]);

        expect(passwordInput.type).toBe('text');
        expect(confirmPasswordInput.type).toBe('text');
    });

    it('przekierowuje do rejestracji przez Google', async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.click(screen.getByRole('button', { name: 'Kontynuuj przez Google' }));

        expect(window.location.href).toContain('/api/authentication/external-login?provider=Google');
        expect(window.location.href).toContain('returnUrl=http%3A%2F%2Flocalhost%3A5173%2Fauth-callback');
    });
});
