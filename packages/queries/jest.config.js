module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@keurzen/shared$': '<rootDir>/../shared/src/index.ts',
    '^@keurzen/stores$': '<rootDir>/../stores/src/index.ts',
  },
};
