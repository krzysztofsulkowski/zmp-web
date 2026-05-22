export function clearAuthStorage(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUserMode');
    localStorage.removeItem('favoriteGameIds');
}

type JwtPayload = Record<string, unknown>;

function decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
    return atob(paddedBase64);
}

export function getTokenPayload(token: string): JwtPayload | null {
    try {
        const payloadBase64 = token.split('.')[1];

        if (!payloadBase64) {
            return null;
        }

        const payload = JSON.parse(decodeBase64Url(payloadBase64));

        if (!payload || typeof payload !== 'object') {
            return null;
        }

        return payload as JwtPayload;
    } catch {
        return null;
    }
}

export function isAuthTokenValid(token: string): boolean {
    const payload = getTokenPayload(token);

    if (!payload) {
        return false;
    }

    if (typeof payload.exp !== 'number') {
        return true;
    }

    return payload.exp * 1000 > Date.now();
}

export function getRolesFromToken(token: string): string[] {
    const payload = getTokenPayload(token);

    if (!payload) {
        return [];
    }

    const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const roles = Array.isArray(role) ? role : [role];

    return roles.filter((item): item is string => typeof item === 'string');
}
