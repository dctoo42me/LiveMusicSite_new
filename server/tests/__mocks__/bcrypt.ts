// server/tests/__mocks__/bcrypt.ts
import { vi } from 'vitest';

export default {
  compare: vi.fn(),
  hash: vi.fn(() => Promise.resolve('hashedpassword')),
};
