import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UsersPage from './page';

const roles = [
    { id: 'role-user', name: 'User', normalizedName: 'USER', concurrencyStamp: '1' },
    { id: 'role-admin', name: 'Admin', normalizedName: 'ADMIN', concurrencyStamp: '2' },
];

const users = [
    {
        userId: 'user-1',
        userName: 'Aneta',
        email: 'aneta@example.com',
        avatarUrl: '',
        roleId: 'role-user',
        roleName: 'User',
        isLocked: false,
        invitationCode: 'INV1',
        availableRoles: roles,
    },
    {
        userId: 'user-2',
        userName: 'Admin',
        email: 'admin@example.com',
        avatarUrl: '',
        roleId: 'role-admin',
        roleName: 'Admin',
        isLocked: true,
        invitationCode: 'INV2',
        availableRoles: roles,
    },
];

function mockUsersApi() {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/adminPanel/users/get-all-users')) {
            return { ok: true, json: async () => ({ data: users }) } as Response;
        }

        if (url.includes('/api/adminPanel/users/roles')) {
            return { ok: true, json: async () => roles } as Response;
        }

        if (url.includes('/api/adminPanel/users/lock-user')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/adminPanel/users/unlock-user')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        if (url.includes('/api/adminPanel/users/update-user')) {
            return { ok: true, json: async () => ({}) } as Response;
        }

        return { ok: true, json: async () => ({}) } as Response;
    }));
}

function renderUsers() {
    return render(
        <MemoryRouter initialEntries={["/users"]}>
            <Routes>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/admin" element={<div>Admin page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('UsersPage', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('authToken', 'test-token');
        mockUsersApi();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('wyświetla użytkowników z panelu administratora', async () => {
        renderUsers();

        expect(await screen.findByText('Aneta')).toBeInTheDocument();
        expect(screen.getByText('aneta@example.com')).toBeInTheDocument();
        expect(screen.getByText('aktywny')).toBeInTheDocument();
        expect(screen.getByText('zablokowany')).toBeInTheDocument();
    });

    it('otwiera modal blokowania i wywołuje endpoint lock-user', async () => {
        const user = userEvent.setup();
        renderUsers();

        const row = (await screen.findByText('Aneta')).closest('tr') as HTMLTableRowElement;
        await user.click(within(row).getByTitle('Zablokuj'));

        expect(screen.getByText('Zablokuj użytkownika')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zablokuj' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/adminPanel/users/lock-user/user-1'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        expect(await screen.findByText('Użytkownik został zablokowany.')).toBeInTheDocument();
    });

    it('otwiera edycję użytkownika i zapisuje zmiany', async () => {
        const user = userEvent.setup();
        renderUsers();

        const row = (await screen.findByText('Aneta')).closest('tr') as HTMLTableRowElement;
        await user.click(within(row).getByTitle('Edytuj'));

        expect(await screen.findByText('Edytuj użytkownika')).toBeInTheDocument();
        const usernameInput = screen.getByDisplayValue('Aneta');
        await user.clear(usernameInput);
        await user.type(usernameInput, 'Aneta QA');
        await user.selectOptions(document.querySelector('select') as HTMLSelectElement, 'role-admin');
        await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/adminPanel/users/update-user'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        const updateCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/api/adminPanel/users/update-user'));
        expect(updateCall?.[1]?.body).toContain('Aneta QA');
        expect(updateCall?.[1]?.body).toContain('role-admin');
    });

    it('pozwala wrócić do panelu admina', async () => {
        const user = userEvent.setup();
        renderUsers();

        await user.click(screen.getByRole('button', { name: /Wróć/i }));
        expect(screen.getByText('Admin page')).toBeInTheDocument();
    });
});
