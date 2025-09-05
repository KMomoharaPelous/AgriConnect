module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 3000,
    collectCoverageFrom: [
        'routes/**/*.js',
        'models/**/*.js',
        '!**/node_modules/**'
    ]
};