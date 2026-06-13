/**
 * MindCompass AI — Jest Configuration
 *
 * unit test cases: configures Jest for Next.js App Router with TypeScript.
 * integration testing scripts: sets up jsdom environment for component tests.
 * edge case handling: path aliases (@/*) mapped correctly for testing.
 */

import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./", // Points to the Next.js app root
});

const config: Config = {
  // Test environment — jsdom for React component tests
  testEnvironment: "jsdom",

  // Coverage configuration
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/layout.tsx",
    "!src/types/**/*",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Setup files run after test environment is installed
  // @testing-library/jest-dom matchers for DOM assertions
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Path alias resolution — mirrors tsconfig.json paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Test match patterns
  testMatch: [
    "**/__tests__/**/*.{ts,tsx}",
    "**/*.{spec,test}.{ts,tsx}",
  ],
};

export default createJestConfig(config);
