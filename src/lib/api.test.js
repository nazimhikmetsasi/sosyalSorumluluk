import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from './api';

const respond = (status, body) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the parsed body as data on success', async () => {
    vi.stubGlobal('fetch', respond(200, { id: 1 }));
    expect(await api('/x')).toEqual({ data: { id: 1 }, error: null });
  });

  it('turns a ProblemDetails body into error.message', async () => {
    vi.stubGlobal('fetch', respond(409, { title: 'Conflict', detail: 'Yeterli porsiyon kalmadı.' }));
    expect(await api('/x', { method: 'POST', body: {} }))
      .toEqual({ data: null, error: { message: 'Yeterli porsiyon kalmadı.' } });
  });

  it('treats an empty 204 as success without data', async () => {
    vi.stubGlobal('fetch', respond(204));
    expect(await api('/x')).toEqual({ data: null, error: null });
  });

  it('reports a network failure instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await api('/x')).toEqual({ data: null, error: { message: 'Sunucuya bağlanılamadı.' } });
  });

  it('sends JSON bodies with a content type', async () => {
    const fetch = respond(200, {});
    vi.stubGlobal('fetch', fetch);
    await api('/x', { method: 'PUT', body: { a: 1 } });
    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });
});
