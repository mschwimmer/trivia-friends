import { badUserInput } from './errors.js';

export const MAX_PAGE_SIZE = 50;

export function paginationArgs(limit = 20, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw badUserInput(`Limit must be between 1 and ${MAX_PAGE_SIZE}.`);
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw badUserInput('Offset must be a non-negative integer.');
  }

  return { take: limit, skip: offset };
}

export function requiredText(
  value: string,
  field: string,
  maxLength: number
): string {
  const normalized = value.trim();

  if (normalized.length < 1 || normalized.length > maxLength) {
    throw badUserInput(
      `${field} must be between 1 and ${maxLength} characters.`
    );
  }

  return normalized;
}

export function optionalText(
  value: string | null | undefined,
  field: string,
  maxLength: number
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw badUserInput(`${field} must be at most ${maxLength} characters.`);
  }

  return normalized || null;
}

export function gridIndex(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw badUserInput(`${field} must be a non-negative integer.`);
  }

  return value;
}

export function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw badUserInput(`${field} must be a positive integer.`);
  }

  return value;
}

export function uniqueIds(ids: readonly string[], field: string): void {
  if (new Set(ids).size !== ids.length) {
    throw badUserInput(`${field} must not contain duplicate IDs.`);
  }
}
