import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ForgotPasswordPage from './page';

function renderForgotPassword() {
    return render(
        <MemoryRouter initialEntries={['/forgot-password']}>
            <Routes>
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

function getForgotPasswordInputs(container: HTMLElement) {
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    return {
        emailInput: inputs[0],
    };
}

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it('wysyła adres e-mail do endpointu resetu hasła i czyści pole po sukcesie', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        const { container } = renderForgotPassword();
        const { emailInput } = getForgotPasswordInputs(container);

        await user.type(emailInput, 'user@example.com');
        await user.click(screen.getByRole('button', { name: 'Wyślij link' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/authentication/forgot-password'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'user@example.com' }),
                })
            );
        });

        expect(await screen.findByText('Jeśli konto z podanym adresem istnieje, wysłaliśmy wiadomość z instrukcją resetu hasła.')).toBeInTheDocument();
        expect(emailInput.value).toBe('');
    });

    it('pokazuje błąd, gdy API nie rozpoczęło resetu hasła', async () => {
        const user = userEvent.setup();

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        } as Response);

        const { container } = renderForgotPassword();
        const { emailInput } = getForgotPasswordInputs(container);

        await user.type(emailInput, 'user@example.com');
        await user.click(screen.getByRole('button', { name: 'Wyślij link' }));

        expect(await screen.findByText('Nie udało się rozpocząć resetu hasła.')).toBeInTheDocument();
    });

    it('wraca do poprzedniej strony po kliknięciu przycisku cofania', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/login', '/forgot-password']} initialIndex={1}>
                <Routes>
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/login" element={<div>Login page</div>} />
                </Routes>
            </MemoryRouter>
        );

        await user.click(screen.getAllByRole('button')[0]);

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });
});
