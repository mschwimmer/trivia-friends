// root level jest config
import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/api/jest.config.ts',
    '<rootDir>/packages/web/jest.config.ts',
    '<rootDir>/packages/shared/jest.config.ts',
  ],
};

export default config;
