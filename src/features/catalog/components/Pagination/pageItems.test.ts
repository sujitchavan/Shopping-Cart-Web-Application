import { getPageItems } from './pageItems';

describe('getPageItems', () => {
  it('lists every page when there are 7 or fewer', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it.each([
    [1, [1, 2, 3, 4, 5, 'ellipsis-end', 20]],
    [10, [1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]],
    [20, [1, 'ellipsis-start', 16, 17, 18, 19, 20]],
  ])('page %d of 20 → %j', (current, expected) => {
    expect(getPageItems(current, 20)).toEqual(expected);
  });
});
