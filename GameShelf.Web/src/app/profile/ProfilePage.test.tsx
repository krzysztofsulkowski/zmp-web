import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './page';

const profile = {
    userId: 'user-1',
    userName: 'Aneta',
    email: 'aneta@example.com',
    avatarUrl: '/avatars/aneta.png',
    bio: 'Testerka gier',
    roleId: 'role-user',
    roleName: 'User',
    isLocked: false,
};

function mockProfileApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes('/api/authentication/me')) {
            return { ok: true, json: async () => profile } as Response;
        }

        if (url.includes('/api/authentication/update-profile')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderProfile() {
    return render(
        <MemoryRouter initialEntries={["/profile"]}>
            <ProfilePage />
        </MemoryRouter>
    );
}

describe('ProfilePage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockProfileApi();
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:avatar-preview'),
        });
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('ładuje dane profilu użytkownika', async () => {
        renderProfile();

        expect(screen.getByText('Ładowanie profilu...')).toBeInTheDocument();
        expect(await screen.findByDisplayValue('Aneta')).toBeInTheDocument();
        expect(screen.getByDisplayValue('aneta@example.com')).toBeDisabled();
        expect(screen.getByDisplayValue('Testerka gier')).toBeInTheDocument();
    });

    it('zapisuje zmienioną nazwę i bio jako FormData', async () => {
        const user = userEvent.setup();
        renderProfile();

        const usernameInput = await screen.findByPlaceholderText('Wpisz nazwę użytkownika');
        const bioInput = screen.getByPlaceholderText('Napisz coś o sobie');

        await user.clear(usernameInput);
        await user.type(usernameInput, 'NowaAneta');
        await user.clear(bioInput);
        await user.type(bioInput, 'Nowe bio');
        await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/authentication/update-profile'),
                expect.objectContaining({ method: 'PUT', body: expect.any(FormData) })
            );
        });

        const updateCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/api/authentication/update-profile'));
        const formData = updateCall?.[1]?.body as FormData;
        expect(formData.get('UserName')).toBe('NowaAneta');
        expect(formData.get('Bio')).toBe('Nowe bio');
        expect(await screen.findByText('Profil został zaktualizowany.')).toBeInTheDocument();
    });

    it('blokuje niedozwolony format avatara', async () => {
        const user = userEvent.setup();
        renderProfile();

        const fileInput = await screen.findByLabelText('Zmień avatar');
        const file = new File(['test'], 'avatar.svg', { type: 'image/svg+xml' });
        await user.upload(fileInput, file);

        expect(screen.getByText('Nieobsługiwany format pliku. Dozwolone: JPG, PNG, WebP, GIF.')).toBeInTheDocument();
    });
});
