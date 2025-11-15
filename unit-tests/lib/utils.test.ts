import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });

    it('should handle empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });

    it('should handle falsy values', () => {
      expect(cn('class1', false, 0, '', 'class2')).toBe('class1 class2');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4'); // Last one wins
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;

      expect(
        cn(
          'base-class',
          isActive && 'active-class',
          isDisabled && 'disabled-class',
        ),
      ).toBe('base-class active-class');
    });

    it('should handle array inputs', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle object inputs', () => {
      expect(cn({ class1: true, class2: false }, 'class3')).toBe(
        'class1 class3',
      );
    });

    it('should handle complex combinations', () => {
      expect(
        cn(
          'base',
          ['conditional1', 'conditional2'],
          { 'object-class': true, 'false-class': false },
          undefined,
          'final-class',
        ),
      ).toBe('base conditional1 conditional2 object-class final-class');
    });

    it('should return empty string for no valid inputs', () => {
      expect(cn()).toBe('');
      expect(cn(undefined, null, false, '')).toBe('');
    });

    it('should handle single class name', () => {
      expect(cn('single-class')).toBe('single-class');
    });
  });
});
