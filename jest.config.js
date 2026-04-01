module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react' }, diagnostics: false }],
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/src/**/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '\\.claude/worktrees/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/queries/*.ts',
    'src/utils/*.ts',
    '!src/**/*.d.ts',
  ],
};
