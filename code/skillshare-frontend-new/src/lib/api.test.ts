import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersApi } from './api';

// Mock the global fetch
global.fetch = vi.fn();

describe('usersApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('getMe should call /api/users/me with correct headers', async () => {
        const mockUser = {
            id: '123',
            fullName: 'Test User',
            email: 'test@example.com',
            credits: 100
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => mockUser
        });

        localStorage.setItem('skillshare_token', 'fake-jwt-token');

        const user = await usersApi.getMe();

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/me'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer fake-jwt-token',
                    'Content-Type': 'application/json'
                })
            })
        );
        expect(user).toEqual(mockUser);
    });

    it('getMe should throw ApiError on failure', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Unauthorized access' })
        });

        try {
            await usersApi.getMe();
        } catch (error: any) {
            expect(error.message).toBe('Unauthorized access');
            expect(error.status).toBe(401);
        }
    });
});
