import {
  gridIndex,
  paginationArgs,
  positiveInteger,
  requiredText,
} from './validation.js';

describe('shared application input validation', () => {
  it('normalizes text and pagination', () => {
    expect(requiredText('  Trivia  ', 'Title', 20)).toBe('Trivia');
    expect(paginationArgs(10, 5)).toEqual({ take: 10, skip: 5 });
  });

  it('rejects invalid limits, coordinates, and values', () => {
    for (const action of [
      () => paginationArgs(51, 0),
      () => paginationArgs(10, -1),
      () => gridIndex(-1, 'Column'),
      () => positiveInteger(0, 'Value'),
    ]) {
      expect(action).toThrow(
        expect.objectContaining({ code: 'BAD_USER_INPUT' })
      );
    }
  });
});
