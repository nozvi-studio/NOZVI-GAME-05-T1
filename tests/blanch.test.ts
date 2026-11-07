import { describe, expect, it } from 'vitest';
import { gradeBlanch } from '../src/core';

const config = { idealSeconds: 3, perfectToleranceSeconds: 0.4, goodToleranceSeconds: 1 };

describe('MEC-001 gradeBlanch', () => {
  it('is perfect inside the perfect window', () => {
    expect(gradeBlanch(3, config)).toBe('perfect');
    expect(gradeBlanch(3.4, config)).toBe('perfect');
  });
  it('is good inside the good window', () => {
    expect(gradeBlanch(2.2, config)).toBe('good');
    expect(gradeBlanch(4, config)).toBe('good');
  });
  it('is bad when under- or over-cooked', () => {
    expect(gradeBlanch(1, config)).toBe('bad');
    expect(gradeBlanch(5, config)).toBe('bad');
  });
  it('uses balance.json by default', () => {
    expect(gradeBlanch(3)).toBe('perfect');
  });
});
