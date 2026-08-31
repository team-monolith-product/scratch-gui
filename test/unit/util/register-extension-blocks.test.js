import {registerExtensionBlocks} from '../../../src/lib/register-extension-blocks';
import {DEFAULT_THEME} from '../../../src/lib/themes';

const createScratchBlocks = () => ({
    Blocks: {},
    defineBlocksWithJsonArray: jest.fn()
});

describe('registerExtensionBlocks', () => {
    test('registers custom field and menu definitions', () => {
        const ScratchBlocks = createScratchBlocks();
        const customField = {type: 'extension_field'};
        const menu = {type: 'extension_menu'};

        registerExtensionBlocks(ScratchBlocks, {
            id: 'extension',
            customFieldTypes: {
                field: {
                    scratchBlocksDefinition: {json: customField}
                }
            },
            menus: [{json: menu}],
            blocks: []
        }, DEFAULT_THEME);

        expect(ScratchBlocks.defineBlocksWithJsonArray).toHaveBeenCalledWith([customField, menu]);
    });

    test('replaces static definitions when extension information is refreshed', () => {
        const ScratchBlocks = createScratchBlocks();
        ScratchBlocks.Blocks.extension_command = {previous: true};
        const block = {type: 'extension_command', message0: 'updated'};

        registerExtensionBlocks(ScratchBlocks, {
            id: 'extension',
            customFieldTypes: {},
            menus: [],
            blocks: [{json: block}]
        }, DEFAULT_THEME);

        expect(ScratchBlocks.defineBlocksWithJsonArray).toHaveBeenCalledWith([block]);
    });

    test('replaces dynamic definitions when extension information is refreshed', () => {
        const ScratchBlocks = createScratchBlocks();
        const previousDefinition = {};
        ScratchBlocks.Blocks.extension_dynamic = previousDefinition;

        registerExtensionBlocks(ScratchBlocks, {
            id: 'extension',
            name: 'Extension',
            color1: '#000000',
            color2: '#000000',
            color3: '#000000',
            customFieldTypes: {},
            menus: [],
            blocks: [{
                info: {
                    isDynamic: true,
                    opcode: 'dynamic'
                }
            }]
        }, DEFAULT_THEME);

        expect(ScratchBlocks.Blocks.extension_dynamic).not.toBe(previousDefinition);
        expect(typeof ScratchBlocks.Blocks.extension_dynamic.init).toBe('function');
    });
});
