module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
};
