import { describe, expect, test } from 'bun:test';
import { numberToLetter, detectValues, throwError, getParams, type AppError } from '../src/utils.js';

describe('numberToLetter', () => {
  test('converts 1 to A', () => {
    expect(numberToLetter(1)).toBe('A');
  });

  test('converts 2 to B', () => {
    expect(numberToLetter(2)).toBe('B');
  });

  test('converts 26 to Z', () => {
    expect(numberToLetter(26)).toBe('Z');
  });

  test('converts 27 to AA', () => {
    expect(numberToLetter(27)).toBe('AA');
  });

  test('converts 28 to AB', () => {
    expect(numberToLetter(28)).toBe('AB');
  });

  test('converts 52 to AZ', () => {
    expect(numberToLetter(52)).toBe('AZ');
  });

  test('converts 53 to BA', () => {
    expect(numberToLetter(53)).toBe('BA');
  });

  test('converts 702 to ZZ', () => {
    expect(numberToLetter(702)).toBe('ZZ');
  });

  test('converts 703 to AAA', () => {
    expect(numberToLetter(703)).toBe('AAA');
  });
});

describe('detectValues', () => {
  test('returns null for empty string', () => {
    expect(detectValues('')).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(detectValues(undefined)).toBeNull();
  });

  test('returns null for null', () => {
    expect(detectValues(null)).toBeNull();
  });

  test('returns true for "TRUE"', () => {
    expect(detectValues('TRUE')).toBe(true);
  });

  test('returns false for "FALSE"', () => {
    expect(detectValues('FALSE')).toBe(false);
  });

  test('returns float for decimal numbers', () => {
    expect(detectValues('3.14')).toBe(3.14);
    expect(detectValues('0.5')).toBe(0.5);
    expect(detectValues('100.99')).toBe(100.99);
  });

  test('returns integer for whole numbers', () => {
    expect(detectValues('42')).toBe(42);
    expect(detectValues('0')).toBe(0);
    expect(detectValues('999')).toBe(999);
  });

  test('returns string for other values', () => {
    expect(detectValues('hello')).toBe('hello');
    expect(detectValues('true')).toBe('true'); // lowercase, not boolean
    expect(detectValues('false')).toBe('false'); // lowercase, not boolean
    expect(detectValues('123abc')).toBe('123abc');
    expect(detectValues('abc123')).toBe('abc123');
  });
});

describe('throwError', () => {
  test('throws an error with the correct message', () => {
    try {
      throwError('Test error', 400);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const err = error as AppError;
      expect(err.message).toBe('Test error');
      expect(err.status).toBe(400);
    }
  });

  test('throws an error with state', () => {
    try {
      throwError('Test error', 500, { key: 'value' });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const err = error as AppError;
      expect(err.message).toBe('Test error');
      expect(err.status).toBe(500);
      expect(err.state).toEqual({ key: 'value' });
    }
  });

  test('throws an error without status', () => {
    try {
      throwError('Test error');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const err = error as AppError;
      expect(err.message).toBe('Test error');
      expect(err.status).toBeUndefined();
    }
  });
});

describe('getParams', () => {
  test('extracts specified parameters from input', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = getParams(input, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('ignores null values', () => {
    const input = { a: 1, b: null, c: 3 };
    const result = getParams(input, ['a', 'b', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('ignores undefined values', () => {
    const input = { a: 1, b: undefined, c: 3 };
    const result = getParams(input, ['a', 'b', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('returns empty object when no params match', () => {
    const input = { a: 1, b: 2 };
    const result = getParams(input, ['c', 'd'] as unknown as ('a' | 'b')[]);
    expect(result).toEqual({});
  });

  test('handles empty input', () => {
    const input = {};
    const result = getParams(input, []);
    expect(result).toEqual({});
  });
});
