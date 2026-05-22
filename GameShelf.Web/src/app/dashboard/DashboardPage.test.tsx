import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './page';

const collections = [
    { id: 1, name: 'Biblioteka', isPublic: true, shareCode: 'lib-code' },
    { id: 2, name: 'Planowane', isPublic: true, shareCode: 'planned-code' },
    { id: 3, name: 'Moja kolekcja', isPublic: false, shareCode: 'custom-code' },
];

const groupedCollections = [
    {
        collectionId: 2,
        collectionName: 'Planowane',
        isPublic: true,
        games: [
            {
                gameId: 10,
                title: 'Cyberpunk 2077',
                imageUrl: '/covers/cyberpunk.jpg',
                description: 'RPG',
                genreName: 'RPG',
                platformName: 'PC',
                collectionId: 2,
                collectionName: 'Planowane',
                addedAt: '2026-05-01T00:00:00Z',
                myRating: 10,
                averageRating: 8.5,
            },
        ],
    },
    {
        collectionId: 3,
        collectionName: 'Moja kolekcja',
        isPublic: false,
        games: [],
    },
];

function mockDashboardApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/collections/lookup')) {
            return { ok: true, json: async () => collections } as Response;
        }

        if (url.includes('/api/collections/grouped-with-games')) {
            return { ok: true, json: async () => ({ data: groupedCollections }) } as Response;
        }

        if (url.includes('/api/games/available-table')) {
            return { ok: true, json: async () => ({ data: [{ id: 10, imageUrl: '/covers/cyberpunk.jpg' }] }) } as Response;
        }

        if (url.includes('/api/statistics/my-library')) {
            return {
                ok: true,
                json: async () => ({
                    totalGames: 1,
                    addedRecentlyCount: 1,
                    gamesByGenre: [{ label: 'RPG', value: 1 }],
                    gamesByPlatform: [{ label: 'PC', value: 1 }],
                    gamesByCollection: [{ label: 'Planowane', value: 1 }],
                }),
            } as Response;
        }

        if (url.includes('/api/collections/create')) {
            return { ok: true, json: async () => ({ id: 4 }) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderDashboard() {
    return render(
        <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/games" element={<div>Games page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('Dashboard', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockDashboardApi();
        vi.stubGlobal('alert', vi.fn());
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
        Object.defineProperty(window, 'location', {
            value: { ...window.location, origin: 'http://localhost:5173' },
            writable: true,
        });
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('pobiera kolekcje, gry oraz statystyki użytkownika', async () => {
        renderDashboard();

        expect(await screen.findByText('Twoje kolekcje')).toBeInTheDocument();
        expect(await screen.findByText('Cyberpunk 2077')).toBeInTheDocument();
        expect(screen.getByText('Twoje statystyki')).toBeInTheDocument();
        expect(screen.getByText('gier w bibliotece')).toBeInTheDocument();

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/collections/grouped-with-games'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('otwiera modal zarządzania grą po kliknięciu kafelka', async () => {
        const user = userEvent.setup();
        renderDashboard();

        await user.click(await screen.findByText('Cyberpunk 2077'));

        expect(screen.getByText('Moja ocena')).toBeInTheDocument();
        expect(screen.getByText('Przenieś do kolekcji')).toBeInTheDocument();
        expect(screen.getByText('Usuń grę z kolekcji')).toBeInTheDocument();
    });

    it('tworzy nową kolekcję z modala dodawania', async () => {
        const user = userEvent.setup();
        renderDashboard();

        const addButtons = await screen.findAllByAltText('add');
        await user.click(addButtons[0]);
        await user.type(screen.getByPlaceholderText('Nazwa kolekcji'), 'Indyki');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/collections/create'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'Indyki', isPublic: true }),
                })
            );
        });
    });
});
