import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProposeGamePage from './page';

const genres = [{ id: 1, name: 'RPG' }];
const platforms = [{ id: 2, name: 'PC' }];

function mockProposeApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/games/genres')) {
            return { ok: true, json: async () => genres } as Response;
        }

        if (url.includes('/api/games/platforms')) {
            return { ok: true, json: async () => platforms } as Response;
        }

        if (url.includes('/api/games/propose')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderProposeGame() {
    return render(
        <MemoryRouter initialEntries={["/propose-game"]}>
            <Routes>
                <Route path="/propose-game" element={<ProposeGamePage />} />
                <Route path="/games" element={<div>Games page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProposeGamePage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockProposeApi();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('ładuje gatunki i platformy', async () => {
        renderProposeGame();

        expect(await screen.findByRole('option', { name: 'RPG' })).toBeInTheDocument();
        expect(await screen.findByRole('option', { name: 'PC' })).toBeInTheDocument();
    });

    it('pokazuje błąd, gdy wymagane pola są puste', async () => {
        const user = userEvent.setup();
        renderProposeGame();

        await user.click(screen.getByRole('button', { name: 'Wyślij propozycję' }));

        expect(screen.getByText('Uzupełnij tytuł, gatunek i platformę.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/games/propose'), expect.anything());
    });

    it('wysyła propozycję gry jako FormData', async () => {
        const user = userEvent.setup();
        renderProposeGame();

        await screen.findByRole('option', { name: 'RPG' });
        const titleInput = document.querySelector('input:not([type=\"file\"])') as HTMLInputElement;
        const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
        const descriptionInput = document.querySelector('textarea') as HTMLTextAreaElement;

        await user.type(titleInput, 'Nowa gra');
        await user.selectOptions(selects[0], '1');
        await user.selectOptions(selects[1], '2');
        await user.type(descriptionInput, 'Opis propozycji');
        await user.click(screen.getByRole('button', { name: 'Wyślij propozycję' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/games/propose'),
                expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
            );
        });

        const proposeCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/api/games/propose'));
        const formData = proposeCall?.[1]?.body as FormData;
        expect(formData.get('Title')).toBe('Nowa gra');
        expect(formData.get('GenreId')).toBe('1');
        expect(formData.get('PlatformId')).toBe('2');
        expect(formData.get('Description')).toBe('Opis propozycji');
        expect(await screen.findByText('Propozycja gry została wysłana do administratora.')).toBeInTheDocument();
    });

    it('pozwala wrócić do wyszukiwarki gier', async () => {
        const user = userEvent.setup();
        renderProposeGame();

        await user.click(screen.getByRole('button', { name: /Wróć/i }));
        expect(screen.getByText('Games page')).toBeInTheDocument();
    });
});
