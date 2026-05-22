import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResetPasswordPage from './page';

function renderResetPassword(initialEntry = '/reset-password?token=reset-token') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

function getResetPasswordInputs(container: HTMLElement) {
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    return {
        emailInput: inputs[0],
        newPasswordInput: inputs[1],
        repeatPasswordInput: inputs[2],
    };
}

async function fillResetForm(user: ReturnType<typeof userEvent.setup>, container: HTMLElement, values?: Partial<{
    email: string;
    newPassword: string;
    repeatPassword: string;
}>) {
    const { emailInput, newPasswordInput, repeatPasswordInput } = getResetPasswordInputs(container);
    await user.type(emailInput, values?.email ?? 'user@example.com');
    await user.type(newPasswordInput, values?.newPassword ?? 'Password1!');
    await user.type(repeatPasswordInput, values?.repeatPassword ?? 'Password1!');
}

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('nie wysyła formularza, gdy w linku brakuje tokenu', async () => {
        const user = userEvent.setup();

        const { container } = renderResetPassword('/reset-password');

        await fillResetForm(user, container);
        await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

        expect(screen.getByText('Brak tokenu resetowania hasła.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('nie wysyła formularza, gdy nowe hasło jest za słabe', async () => {
        const user = userEvent.setup();

        const { container } = renderResetPassword();

        await fillResetForm(user, container, {
            newPassword: 'abc',
            repeatPassword: 'abc',
        });
        await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

        expect(screen.getByText('Hasło musi zawierać min. 8 znaków, wielką literę, cyfrę i znak specjalny.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('nie wysyła formularza, gdy powtórzone hasło jest inne', async () => {
        const user = userEvent.setup();

        const { container } = renderResetPassword();

        await fillResetForm(user, container, {
            newPassword: 'Password1!',
            repeatPassword: 'Password2!',
        });
        await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

        expect(screen.getByText('Hasła nie są takie same.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('wysyła e-mail, token i nowe hasło do API', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        const { container } = renderResetPassword('/reset-password?token=abc%2B123%2Fxyz');

        await fillResetForm(user, container);
        await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/authentication/reset-password'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'user@example.com',
                        token: 'abc+123/xyz',
                        newPassword: 'Password1!',
                    }),
                })
            );
        });

        expect(screen.getByText('Hasło zostało zmienione. Możesz się teraz zalogować.')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Login page')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('czyści pola po poprawnej zmianie hasła', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        const { container } = renderResetPassword();

        const { emailInput, newPasswordInput, repeatPasswordInput } = getResetPasswordInputs(container);

        await fillResetForm(user, container);
        await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

        await screen.findByText('Hasło zostało zmienione. Możesz się teraz zalogować.');

        expect(emailInput.value).toBe('');
        expect(newPasswordInput.value).toBe('');
        expect(repeatPasswordInput.value).toBe('');
    });

    it('pokazuje błąd, gdy API odrzuci zmianę hasła', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ title: 'Bad request' }),
        } as Response);

        const { container } = renderResetPassword();

        await fillResetForm(user, container);
        await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

        expect(await screen.findByText('Nie udało się zmienić hasła. Sprawdź poprawność danych.')).toBeInTheDocument();
    });

    it('pozwala przełączyć widoczność obu pól hasła', async () => {
        const user = userEvent.setup();

        const { container } = renderResetPassword();

        const { newPasswordInput, repeatPasswordInput } = getResetPasswordInputs(container);

        expect(newPasswordInput.type).toBe('password');
        expect(repeatPasswordInput.type).toBe('password');

        await user.click(screen.getAllByRole('button', { name: 'Pokaż hasło' })[0]);
        await user.click(screen.getAllByRole('button', { name: 'Pokaż hasło' })[0]);

        expect(newPasswordInput.type).toBe('text');
        expect(repeatPasswordInput.type).toBe('text');
    });
});
