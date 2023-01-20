import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    verbose: true,
    transform: {
        '^.+\\.ts?$': ['ts-jest', {
            useESM: true,
        },],
    },
    testPathIgnorePatterns: ['__tests__/utils.ts'],
    roots: ['__tests__'],
    extensionsToTreatAsEsm: ['.ts'],
};

export default config;