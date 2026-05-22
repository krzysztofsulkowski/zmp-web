export function clearAuthStorage(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUserMode');
    localStorage.removeItem('favoriteGameIds');
}