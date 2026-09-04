import {
    addIntegrationTestMode,
    isIntegrationTestMode
} from '../../../src/playground/integration-test-mode';

describe('integration test mode', () => {
    describe('isIntegrationTestMode', () => {
        test('is disabled without an explicit true query parameter', () => {
            expect(isIntegrationTestMode('file:///build/index.html')).toBe(false);
            expect(isIntegrationTestMode('file:///build/index.html?integration_test=false')).toBe(false);
        });

        test('is enabled by an explicit true query parameter', () => {
            expect(isIntegrationTestMode('file:///build/index.html?integration_test=true')).toBe(true);
            expect(isIntegrationTestMode('file:///build/index.html?locale=ja&integration_test=true#123')).toBe(true);
        });

        test('cannot expose the test surface from an HTTP deployment', () => {
            expect(isIntegrationTestMode('https://example.com/index.html?integration_test=true')).toBe(false);
        });
    });

    describe('addIntegrationTestMode', () => {
        test('adds the query parameter before a project hash', () => {
            expect(addIntegrationTestMode('file:///build/index.html#123'))
                .toBe('file:///build/index.html?integration_test=true#123');
        });

        test('preserves existing query parameters', () => {
            expect(addIntegrationTestMode('file:///build/index.html?locale=ja#123'))
                .toBe('file:///build/index.html?locale=ja&integration_test=true#123');
        });

        test('does not add the query parameter twice', () => {
            const uri = 'file:///build/index.html?integration_test=true';
            expect(addIntegrationTestMode(uri)).toBe(uri);
        });
    });
});
