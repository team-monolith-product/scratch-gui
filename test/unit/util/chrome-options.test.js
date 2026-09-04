import createChromeOptions from '../../helpers/chrome-options';

describe('createChromeOptions', () => {
    test('uses the configured Chrome binary', () => {
        expect(createChromeOptions(['--headless'], '/opt/chrome-for-testing/chrome')).toEqual({
            args: ['--headless'],
            binary: '/opt/chrome-for-testing/chrome'
        });
    });

    test('omits the binary when none is configured', () => {
        expect(createChromeOptions(['--headless'])).toEqual({
            args: ['--headless']
        });
    });
});
