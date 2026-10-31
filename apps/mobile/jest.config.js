module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/lib/**/*.test.ts', '<rootDir>/components/**/*.test.tsx'],
  // pnpm nests packages under node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/,
  // so the classic React Native pattern (anchored at the first node_modules/)
  // never reaches the package name. Allowing ".pnpm" lets the second segment
  // be matched, so RN/Expo/flow files still get transformed by babel-jest.
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo|@expo|@expo-google-fonts|babel-preset-expo|@sanro|\\.pnpm))',
  ],
};
