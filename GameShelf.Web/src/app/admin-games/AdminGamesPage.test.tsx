import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminGamesPage from './page';

const genres = [{ id: 1, name: 'RPG' }];
const platforms = [{ id: 2, name: 'PC' }];
const availableGames = [
    { id: 10, title: 'Hades', description: 'Roguelike', genreName: 'Roguelike', platformName: 'PC', imageUrl: '/hades.jpg' },
];
const pendingGames = [
    { id: 20, title: 'Disco Elysium', description: 'RPG', genreId: 1, platformId: 2, imageUrl: '/disco.jpg', status: 0, suggestedByUserId: 'user-1', rejectionReason: '', genre: { id: 1, name: 'RPG' }, platform: { id: 2, name: 'PC' } },
];

function mockAdminGamesApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/games/available-table')) {
            return { ok: true, json: async () => ({ data: availableGames }) } as Response;
        }

        if (url.includes('/api/games/pending-approvals')) {
            return { ok: true, json: async () => pendingGames } as Response;
        }

        if (url.includes('/api/games/genres')) {
            return { ok: true, json: async () => genres } as Response;
        }

        if (url.includes('/api/games/platforms')) {
            return { ok: true, json: async () => platforms } as Response;
        }

        if (url.includes('/api/games/create-game')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/games/delete-game')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/games/accept')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/games/reject-proposal')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderAdminGames() {
    return render(
        <MemoryRouter initialEntries={["/admin-games"]}>
            <Routes>
                <Route path="/admin-games" element={<AdminGamesPage />} />
                <Route path="/admin" element={<div>Admin page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('AdminGamesPage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockAdminGamesApi();
        vi.stubGlobal('confirm', vi.fn(() => true));
        vi.stubGlobal('prompt', vi.fn(() => 'Duplikat'));
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('ładuje propozycje oczekujące i globalną bibliotekę', async () => {
        renderAdminGames();

        expect(await screen.findByText('Disco Elysium')).toBeInTheDocument();
        expect(screen.getByText('Hades')).toBeInTheDocument();
        expect(screen.getByText('Propozycje oczekujące')).toBeInTheDocument();
        expect(screen.getByText('Globalna biblioteka')).toBeInTheDocument();
    });

    it('dodaje nową grę z formularza administratora', async () => {
        const user = userEvent.setup();
        renderAdminGames();

        await user.type(await screen.findByPlaceholderText('Tytuł'), 'Nowa gra');
        await user.selectOptions(screen.getByDisplayValue('Wybierz gatunek'), '1');
        await user.selectOptions(screen.getByDisplayValue('Wybierz platformę'), '2');
        await user.type(screen.getByPlaceholderText('Opis'), 'Opis gry');
        await user.click(screen.getByRole('button', { name: 'Dodaj grę' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/create-game'),
                expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
            );
        });

        expect(await screen.findByText('Gra została dodana.')).toBeInTheDocument();
    });

    it('akceptuje propozycję gry', async () => {
        const user = userEvent.setup();
        renderAdminGames();

        await user.click(await screen.findByRole('button', { name: 'Akceptuj' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/accept/20'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        expect(await screen.findByText('Gra została zaakceptowana.')).toBeInTheDocument();
    });

    it('odrzuca propozycję gry z powodem', async () => {
        const user = userEvent.setup();
        renderAdminGames();

        await user.click(await screen.findByRole('button', { name: 'Odrzuć' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/reject-proposal/20?reason=Duplikat'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    it('usuwa grę po potwierdzeniu', async () => {
        const user = userEvent.setup();
        renderAdminGames();

        await user.click(await screen.findByRole('button', { name: 'Usuń' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/delete-game/10'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    it('pozwala wrócić do panelu admina', async () => {
        const user = userEvent.setup();
        renderAdminGames();

        await user.click(screen.getByRole('button', { name: /Wróć/i }));
        expect(screen.getByText('Admin page')).toBeInTheDocument();
    });
});
