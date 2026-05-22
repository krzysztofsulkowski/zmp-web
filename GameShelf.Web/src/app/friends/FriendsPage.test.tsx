import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FriendsPage from './page';

const friends = [
    { id: 'friend-1', userId: 'friend-1', userName: 'Kasia', email: 'kasia@example.com', bio: 'Lubi RPG' },
];

const requests = [
    { id: 'request-1', userId: 'request-1', userName: 'Marek', email: 'marek@example.com' },
];

const searchResults = [
    { id: 'user-1', userId: 'user-1', userName: 'Ola', email: 'ola@example.com' },
];

function mockFriendsApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/friends/my-friends')) {
            return { ok: true, json: async () => friends } as Response;
        }

        if (url.includes('/api/friends/pending-requests')) {
            return { ok: true, json: async () => requests } as Response;
        }

        if (url.includes('/api/friends/search')) {
            return { ok: true, json: async () => ({ data: searchResults }) } as Response;
        }

        if (url.includes('/api/friends/add-by-username')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/friends/send-invite')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/friends/accept')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/friends/reject-or-remove')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderFriends() {
    return render(
        <MemoryRouter initialEntries={["/friends"]}>
            <Routes>
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/friends/:friendId" element={<div>Friend collections page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('FriendsPage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockFriendsApi();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('wyświetla listę znajomych pobraną z API', async () => {
        renderFriends();

        expect(await screen.findByText('Kasia')).toBeInTheDocument();
        expect(screen.getByText('Lubi RPG')).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/friends/my-friends'),
            expect.objectContaining({ method: 'GET' })
        );
    });

    it('obsługuje zaproszenia oczekujące', async () => {
        const user = userEvent.setup();
        renderFriends();

        await user.click(await screen.findByRole('button', { name: /Zaproszenia/i }));
        expect(screen.getByText('Marek')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Akceptuj' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/friends/accept/request-1'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        expect(await screen.findByText('Zaproszenie zaakceptowane.')).toBeInTheDocument();
    });

    it('wyszukuje użytkowników i wysyła zaproszenie po nazwie', async () => {
        const user = userEvent.setup();
        renderFriends();

        await user.click(await screen.findByRole('button', { name: 'Znajdź użytkownika' }));
        await user.type(screen.getByPlaceholderText('Wpisz nazwę użytkownika'), 'Ola');
        await user.click(screen.getByRole('button', { name: 'Szukaj' }));

        expect(await screen.findByText('Ola')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Dodaj' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/friends/add-by-username/Ola'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('wysyła zaproszenie e-mail', async () => {
        const user = userEvent.setup();
        renderFriends();

        await user.click(await screen.findByRole('button', { name: 'Znajdź użytkownika' }));
        await user.type(screen.getByPlaceholderText('Adres e-mail'), 'new@example.com');
        await user.click(screen.getByRole('button', { name: 'Wyślij' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/friends/send-invite?email=new%40example.com'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        expect(await screen.findByText('Zaproszenie e-mail zostało wysłane.')).toBeInTheDocument();
    });
});
