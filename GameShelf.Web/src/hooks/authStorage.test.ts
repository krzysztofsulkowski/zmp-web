import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    clearAuthStorage,
    getTokenPayload,
    isAuthTokenValid,
    getRolesFromToken,
} from './authStorage';

function makeJwt(payload: object): string {
    const encode = (obj: object) =>
        btoa(JSON.stringify(obj))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fakesig`;
}

describe('clearAuthStorage', () => {
    beforeEach(() => {
        localStorage.setItem('authToken', 'abc');
        localStorage.setItem('adminUserMode', 'true');
        localStorage.setItem('favoriteGameIds', '[1,2,3]');
    });

    it('usuwa authToken z localStorage', () => {
        clearAuthStorage();
        expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('usuwa adminUserMode z localStorage', () => {
        clearAuthStorage();
        expect(localStorage.getItem('adminUserMode')).toBeNull();
    });

    it('usuwa favoriteGameIds z localStorage', () => {
        clearAuthStorage();
        expect(localStorage.getItem('favoriteGameIds')).toBeNull();
    });
});

describe('getTokenPayload', () => {
    it('zwraca payload z prawidłowego JWT', () => {
        const token = makeJwt({ sub: '123', email: 'test@example.com' });
        const payload = getTokenPayload(token);
        expect(payload).toMatchObject({ sub: '123', email: 'test@example.com' });
    });

    it('zwraca null gdy token nie ma trzech segmentów', () => {
        expect(getTokenPayload('tylko.dwa')).toBeNull();
        expect(getTokenPayload('jeden')).toBeNull();
    });

    it('zwraca null gdy segment payload nie jest prawidłowym JSON', () => {
        expect(getTokenPayload('header.!!!.sig')).toBeNull();
    });

    it('zwraca null gdy payload nie jest obiektem', () => {
        const notAnObject = btoa(JSON.stringify('string')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        expect(getTokenPayload(`header.${notAnObject}.sig`)).toBeNull();
    });
});

describe('isAuthTokenValid', () => {
    it('zwraca true gdy token nie ma pola exp', () => {
        const token = makeJwt({ sub: '1', email: 'a@b.com' });
        expect(isAuthTokenValid(token)).toBe(true);
    });

    it('zwraca true gdy token nie wygasł', () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600;
        const token = makeJwt({ sub: '1', exp: futureExp });
        expect(isAuthTokenValid(token)).toBe(true);
    });

    it('zwraca false gdy token wygasł', () => {
        const pastExp = Math.floor(Date.now() / 1000) - 1;
        const token = makeJwt({ sub: '1', exp: pastExp });
        expect(isAuthTokenValid(token)).toBe(false);
    });

    it('zwraca false gdy token jest całkowicie nieprawidłowy', () => {
        expect(isAuthTokenValid('to.nie.jwt')).toBe(false);
    });

    it('uznaje token za ważny dokładnie na granicy exp (Date.now jest mockowany)', () => {
        const now = 1700000000;
        vi.spyOn(Date, 'now').mockReturnValueOnce(now * 1000);
        const token = makeJwt({ exp: now + 1 });
        expect(isAuthTokenValid(token)).toBe(true);
        vi.restoreAllMocks();
    });
});

describe('getRolesFromToken', () => {
    it('zwraca role z pola "role" (pojedyncza wartość)', () => {
        const token = makeJwt({ sub: '1', role: 'User' });
        expect(getRolesFromToken(token)).toEqual(['User']);
    });

    it('zwraca role z pola "role" (tablica)', () => {
        const token = makeJwt({ sub: '1', role: ['User', 'Administrator'] });
        expect(getRolesFromToken(token)).toEqual(['User', 'Administrator']);
    });

    it('zwraca role z Microsoft claims URI', () => {
        const token = makeJwt({
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Administrator',
        });
        expect(getRolesFromToken(token)).toEqual(['Administrator']);
    });

    it('zwraca pustą tablicę gdy brak pola roli', () => {
        const token = makeJwt({ sub: '1', email: 'a@b.com' });
        expect(getRolesFromToken(token)).toEqual([]);
    });

    it('zwraca pustą tablicę dla nieprawidłowego tokenu', () => {
        expect(getRolesFromToken('zly.token')).toEqual([]);
    });

    it('filtruje wartości nie-stringowe z tablicy ról', () => {
        const token = makeJwt({ role: ['Admin', 42, null, 'User'] });
        expect(getRolesFromToken(token)).toEqual(['Admin', 'User']);
    });
});
