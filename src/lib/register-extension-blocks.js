import defineDynamicBlock from './define-dynamic-block';
import {injectExtensionBlockTheme} from './themes/blockHelpers';

const defineExtensionBlocks = (ScratchBlocks, categoryInfo, theme) => {
    if (!categoryInfo) return;

    const staticBlocksJson = [];
    const dynamicBlocksInfo = [];

    const collectDefinitions = blockInfoArray => {
        (blockInfoArray || []).forEach(blockInfo => {
            if (blockInfo.info && blockInfo.info.isDynamic) {
                dynamicBlocksInfo.push(blockInfo);
            } else if (blockInfo.json) {
                staticBlocksJson.push(theme ?
                    injectExtensionBlockTheme(blockInfo.json, theme) : blockInfo.json);
            }
        });
    };

    const customFieldTypes = categoryInfo.customFieldTypes || {};
    collectDefinitions(Object.getOwnPropertyNames(customFieldTypes)
        .map(fieldTypeName => customFieldTypes[fieldTypeName].scratchBlocksDefinition));
    collectDefinitions(categoryInfo.menus);
    collectDefinitions(categoryInfo.blocks);

    if (staticBlocksJson.length > 0) {
        ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
    }

    dynamicBlocksInfo.forEach(blockInfo => {
        const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
        ScratchBlocks.Blocks[extendedOpcode] =
            defineDynamicBlock(ScratchBlocks, categoryInfo, blockInfo, extendedOpcode);
    });
};

export const registerExtensionBlocks = (ScratchBlocks, categoryInfo, theme) => {
    defineExtensionBlocks(ScratchBlocks, categoryInfo, theme);
};
