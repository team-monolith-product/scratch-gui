import path from 'path';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    clickText,
    findVisibleByXpath,
    getDriver,
    getLogs,
    loadUri,
    textToXpath
} = new SeleniumHelper();

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

describe('Working with the how-to library', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('Backpack is "Coming Soon" without backpack host param', async () => {
        await loadUri(uri);
        // Check that the backpack header is visible and wrapped in a coming soon tooltip
        await clickText('Backpack', '*[@data-for="backpack-tooltip"]');
        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Backpack can be expanded with backpack host param', async () => {
        await loadUri(`${uri}?backpack_host=https://backpack.scratch.mit.edu`);

        // Try activating the backpack from the costumes tab to make sure it isn't pushed off
        await clickText('Costumes');

        const backpackHeader = await findVisibleByXpath('//div[contains(@class, "backpack_backpack-header")]');
        await backpackHeader.click();
        await findVisibleByXpath(textToXpath('Backpack is empty'));
        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });
});
