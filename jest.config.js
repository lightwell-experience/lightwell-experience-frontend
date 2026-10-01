module.exports = {
  roots: ['<rootDir>/src/'],
  preset: 'ts-jest',
  maxWorkers: '50%',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFiles: [],
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.ts'],
  moduleDirectories: ['<rootDir>/node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/config/empty.js',
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    // use cjs versions of patternfly packages, not esm
    '^(@patternfly/[a-zA-Z0-9_-]+)/dist/esm/(.*)$': '$1/dist/js/$2',
  },
  transformIgnorePatterns: [],
};
