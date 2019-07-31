import { sum } from '../src/index';

test('sum', (): void => {
    expect(sum(2, 2)).toBe(4);
});
