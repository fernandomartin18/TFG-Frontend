import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock de auth.service ANTES de importar api.service (hoisted automáticamente)
vi.mock('../../../src/services/auth.service.js', () => ({
  default: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    refreshToken: vi.fn(),
    clearAuthData: vi.fn(),
  },
}));

import { fetchWithAuth } from '../../../src/services/api.service.js';
import authService from '../../../src/services/auth.service.js';

// Helper: crea un Response mock
const mockResponse = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(body),
});

describe('fetchWithAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('añade Content-Type: application/json para peticiones no-FormData', async () => {
    authService.getAccessToken.mockReturnValue(null);
    global.fetch.mockResolvedValue(mockResponse(200, {}));

    await fetchWithAuth('http://test.com/api', { method: 'POST', body: JSON.stringify({}) });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('NO añade Content-Type si el body es FormData', async () => {
    authService.getAccessToken.mockReturnValue(null);
    global.fetch.mockResolvedValue(mockResponse(200, {}));

    await fetchWithAuth('http://test.com/api', { method: 'POST', body: new FormData() });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBeUndefined();
  });

  test('añade Authorization header si hay token', async () => {
    authService.getAccessToken.mockReturnValue('my-token');
    global.fetch.mockResolvedValue(mockResponse(200, {}));

    await fetchWithAuth('http://test.com/api');

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer my-token');
  });

  test('NO añade Authorization si no hay token', async () => {
    authService.getAccessToken.mockReturnValue(null);
    global.fetch.mockResolvedValue(mockResponse(200, {}));

    await fetchWithAuth('http://test.com/api');

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  test('devuelve la respuesta directamente si es 200', async () => {
    authService.getAccessToken.mockReturnValue('token');
    global.fetch.mockResolvedValue(mockResponse(200, { data: 'ok' }));

    const resp = await fetchWithAuth('http://test.com/api');

    expect(resp.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('reintenta con nuevo token si recibe 401 y hay refreshToken', async () => {
    authService.getAccessToken.mockReturnValue('expired-token');
    authService.getRefreshToken.mockReturnValue('refresh-token');
    authService.refreshToken.mockResolvedValue('new-token');
    global.fetch
      .mockResolvedValueOnce(mockResponse(401, {}))
      .mockResolvedValueOnce(mockResponse(200, { data: 'ok' }));

    const resp = await fetchWithAuth('http://test.com/api');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(resp.ok).toBe(true);
    // Segunda llamada debe llevar el nuevo token
    const secondHeaders = global.fetch.mock.calls[1][1].headers;
    expect(secondHeaders['Authorization']).toBe('Bearer new-token');
  });

  test('lanza error y limpia sesión si el refresh falla', async () => {
    authService.getAccessToken.mockReturnValue('expired-token');
    authService.getRefreshToken.mockReturnValue('bad-refresh');
    authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
    global.fetch.mockResolvedValueOnce(mockResponse(401, {}));

    await expect(fetchWithAuth('http://test.com/api')).rejects.toThrow(
      'Sesión expirada'
    );
    expect(authService.clearAuthData).toHaveBeenCalled();
  });

  test('no intenta refresh si no hay refreshToken al recibir 401', async () => {
    authService.getAccessToken.mockReturnValue('token');
    authService.getRefreshToken.mockReturnValue(null);
    global.fetch.mockResolvedValue(mockResponse(401, {}));

    const resp = await fetchWithAuth('http://test.com/api');

    // Sin refresh, simplemente devuelve la respuesta 401
    expect(resp.status).toBe(401);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
