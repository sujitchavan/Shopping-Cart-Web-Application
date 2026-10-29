import { PLACEHOLDER_IMAGE, safeImageUrl } from './safeUrl';

describe('safeImageUrl', () => {
  it('keeps https URLs on the allow-listed host', () => {
    const url = 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg';
    expect(safeImageUrl(url)).toBe(url);
  });

  it.each([
    ['javascript:alert(1)'],
    ['data:image/svg+xml;base64,PHN2Zz4='],
    ['http://fakestoreapi.com/img/a.jpg'],
    ['https://evil.example.com/a.jpg'],
    ['https://fakestoreapi.com.evil.example/a.jpg'],
    ['https://user:pass@fakestoreapi.com/a.jpg'],
    ['//fakestoreapi.com/a.jpg'],
    ['not a url'],
    [''],
    [`https://fakestoreapi.com/${'a'.repeat(3000)}`],
    [null],
    [42],
    [undefined],
  ])('replaces %s with the placeholder', (raw) => {
    expect(safeImageUrl(raw)).toBe(PLACEHOLDER_IMAGE);
  });

  it('accepts a custom allow-list', () => {
    expect(safeImageUrl('https://cdn.example.com/a.png', new Set(['cdn.example.com']))).toBe(
      'https://cdn.example.com/a.png',
    );
  });
});
