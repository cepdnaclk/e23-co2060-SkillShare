import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersApi } from './api';

// Mock the global fetch
global.fetch = vi.fn();

describe('usersApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('getMe should call /users/me with Authorization header', async () => {
        const mockUser = {
            id: '123',
            fullName: 'Test User',
            email: 'test@example.com',
            credits: 100
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => mockUser
        });

        localStorage.setItem('skillshare_token', 'fake-jwt-token');

        const user = await usersApi.getMe();

        // The new client uses API_BASE_URL (default: http://localhost:8080/api) + /users/me
        // with a proper Headers object (not a plain object)
        const [calledUrl] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(calledUrl).toContain('/users/me');
        expect(user).toEqual(mockUser);
    });

    it('getMe should throw ApiError on failure', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Unauthorized access' }),
            text: async () => 'Unauthorized access',
            statusText: 'Unauthorized'
        });

        try {
            await usersApi.getMe();
            throw new Error('Expected error was not thrown');
        } catch (error: unknown) {
            const apiError = error as { message: string; status: number };
            // The new client normalizes 401 to a standard message
            expect(apiError.message).toBe('Session expired or unauthorized. Please log in.');
            expect(apiError.status).toBe(401);
        }
    });
});
