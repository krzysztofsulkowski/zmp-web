import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GamesPage from './page';

const collections = [
    { id: 1, name: 'Biblioteka', isPublic: true },
    { id: 2, name: 'Planowane', isPublic: true },
    { id: 3, name: 'Ukończone', isPublic: true },
];

const games = [
    {
        id: 50,
        title: 'Hades',
        description: 'Roguelike',
        imageUrl: '/hades.jpg',
        genreName: 'Roguelike',
        platformName: 'PC',
        averageRating: 9,
        myRating: null,
    },
];

function mockGamesApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/collections/lookup')) {
            return { ok: true, json: async () => collections } as Response;
        }

        if (url.includes('/api/collections/grouped-with-games')) {
            return { ok: true, json: async () => ({ data: [] }) } as Response;
        }

        if (url.includes('/api/games/available-table')) {
            return { ok: true, json: async () => ({ data: games }) } as Response;
        }

        if (url.includes('/api/games/add-to-collection')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/games/rate')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderGames(initialEntry = '/games') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/games" element={<GamesPage />} />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
                <Route path="/propose-game" element={<div>Propose page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('GamesPage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockGamesApi();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('wyszukuje gry po wpisaniu tytułu', async () => {
        const user = userEvent.setup();
        renderGames();

        await user.type(screen.getByPlaceholderText('Wpisz nazwę gry...'), 'Hades');

        expect(await screen.findByText('Hades')).toBeInTheDocument();
        expect(screen.getByText('Roguelike · PC')).toBeInTheDocument();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/available-table'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('pozwala przejść do proponowania nowej gry', async () => {
        const user = userEvent.setup();
        renderGames();

        await user.type(screen.getByPlaceholderText('Wpisz nazwę gry...'), 'Nieznana gra');
        await user.click(screen.getByRole('button', { name: 'Zaproponuj nową' }));

        expect(screen.getByText('Propose page')).toBeInTheDocument();
    });

    it('dodaje grę do wybranej kolekcji i zapisuje ocenę', async () => {
        const user = userEvent.setup();
        renderGames('/games?collectionId=2');

        await user.type(screen.getByPlaceholderText('Wpisz nazwę gry...'), 'Hades');
        await user.click(await screen.findByRole('button', { name: 'Dodaj do kolekcji' }));
        await user.selectOptions(screen.getByLabelText(/Moja ocena/i), '10');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/add-to-collection/50?collectionId=2'),
                expect.objectContaining({ method: 'POST' })
            );
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/rate'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ gameId: 50, rating: 10 }),
                })
            );
        });

        expect(await screen.findByText('Gra została dodana do kolekcji.')).toBeInTheDocument();
    });
});
