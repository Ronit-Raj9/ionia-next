import { ValidationErrors } from './types';

/**
 * Safely get a string error message from the errors object
 * 
 * @param errors The validation errors object
 * @param path The path to the error message (can be a string key or array path)
 * @returns The error message or null if no error exists or it's not a string
 */
export const getErrorMessage = (errors: ValidationErrors, path: string | string[]): string | null => {
  if (!errors) return null;
  
  // Handle simple string key
  if (typeof path === 'string') {
    const error = errors[path];
    return typeof error === 'string' ? error : null;
  }
  
  // Handle nested path
  let current: any = errors;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = current[key];
  }
  
  return typeof current === 'string' ? current : null;
}; 