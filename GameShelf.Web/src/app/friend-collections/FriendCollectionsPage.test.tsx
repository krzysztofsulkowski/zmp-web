import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FriendCollectionsPage from './page';

const friend = { id: 'friend-1', userId: 'friend-1', userName: 'Kasia', bio: 'Lubi RPG' };

const collections = [
    {
        collectionId: 10,
        collectionName: 'Publiczne RPG',
        isPublic: true,
        games: [
            {
                gameId: 100,
                title: 'Baldur Gate 3',
                imageUrl: '/bg3.jpg',
                description: 'RPG',
                genreName: 'RPG',
                platformName: 'PC',
                collectionId: 10,
                collectionName: 'Publiczne RPG',
                addedAt: '2026-05-01T00:00:00Z',
            },
        ],
    },
    {
        collectionId: 11,
        collectionName: 'Prywatne',
        isPublic: false,
        games: [{ gameId: 101, title: 'Secret Game', imageUrl: null, description: null, genreName: 'Akcja', platformName: 'PC', collectionId: 11, collectionName: 'Prywatne', addedAt: '2026-05-02T00:00:00Z' }],
    },
];

const compareGames = [
    { gameId: 100, title: 'Baldur Gate 3', ownedByMe: true, ownedByFriend: true, imageUrl: '/bg3.jpg' },
    { gameId: 102, title: 'Disco Elysium', ownedByMe: false, ownedByFriend: true, imageUrl: '/disco.jpg' },
    { gameId: 103, title: 'Hades', ownedByMe: true, ownedByFriend: false, imageUrl: '/hades.jpg' },
];

function mockFriendCollectionsApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/friends/my-friends')) {
            return { ok: true, json: async () => [friend] } as Response;
        }

        if (url.includes('/api/friends/friend-1/collections-with-games')) {
            return { ok: true, json: async () => ({ data: collections, friendProfile: friend }) } as Response;
        }

        if (url.includes('/api/games/available-table')) {
            return { ok: true, json: async () => ({ data: [{ id: 100, imageUrl: '/bg3.jpg' }] }) } as Response;
        }

        if (url.includes('/api/friends/compare/friend-1')) {
            return { ok: true, json: async () => compareGames } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderFriendCollections() {
    return render(
        <MemoryRouter initialEntries={["/friends/friend-1"]}>
            <Routes>
                <Route path="/friends/:friendId" element={<FriendCollectionsPage />} />
                <Route path="/friends" element={<div>Friends page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('FriendCollectionsPage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockFriendCollectionsApi();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('wyświetla profil znajomego i tylko publiczne kolekcje', async () => {
        renderFriendCollections();

        expect(await screen.findByText('Kasia')).toBeInTheDocument();
        expect(screen.getByText('Lubi RPG')).toBeInTheDocument();
        expect(screen.getByText('Publiczne RPG')).toBeInTheDocument();
        expect(screen.queryByText('Prywatne')).not.toBeInTheDocument();
        expect(screen.getAllByText('Baldur Gate 3').length).toBeGreaterThan(0);
    });

    it('pokazuje statystyki wspólnej półki', async () => {
        renderFriendCollections();

        expect(await screen.findByText('Wasza wspólna półka')).toBeInTheDocument();
        expect(screen.getByText('Gracie razem')).toBeInTheDocument();
        expect(screen.getByText('Tylko Ty masz')).toBeInTheDocument();
        expect(screen.getByText('Tylko Kasia ma')).toBeInTheDocument();
        expect(screen.getAllByText('Disco Elysium').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Hades').length).toBeGreaterThan(0);
    });

    it('pozwala wrócić do listy znajomych', async () => {
        const user = userEvent.setup();
        renderFriendCollections();

        await user.click(await screen.findByRole('button', { name: /Wróć/i }));
        expect(screen.getByText('Friends page')).toBeInTheDocument();
    });
});
