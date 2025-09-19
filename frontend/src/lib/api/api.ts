// lib/api/api.ts
// Central API module that exports all API functions

import { getSolutions } from '@/features/tests/api/testsApi';

// Export the API object with all methods
export const API = {
  tests: {
    getSolutions,
  },
};

export default API;
