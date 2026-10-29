import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies safe defaults', () => {
    expect(parseEnv({})).toEqual({
      apiBaseUrl: 'https://fakestoreapi.com',
      basePath: '/',
      isDev: false,
      isTest: false,
    });
  });

  it('normalises the API URL and base path', () => {
    const env = parseEnv({
      VITE_API_BASE_URL: 'https://api.example.com/v1//',
      BASE_URL: '/shop',
      MODE: 'test',
      DEV: true,
    });
    expect(env).toEqual({
      apiBaseUrl: 'https://api.example.com/v1',
      basePath: '/shop/',
      isDev: true,
      isTest: true,
    });
  });

  it.each([['http://insecure.example.com'], ['not a url'], ['javascript:alert(1)']])(
    'rejects %s as the API URL',
    (url) => {
      expect(() => parseEnv({ VITE_API_BASE_URL: url })).toThrow();
    },
  );
});
