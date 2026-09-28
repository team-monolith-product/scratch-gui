const ELEMENT_NODE = 1;

const getElementChildren = element => Array.from(element.childNodes)
    .filter(child => child.nodeType === ELEMENT_NODE);

const getTagName = element => element.tagName.toLowerCase();

const VARIABLE_BLOCK_TYPES = [
    'data_variable',
    'data_setvariableto',
    'data_changevariableby',
    'data_showvariable',
    'data_hidevariable'
];

const LIST_BLOCK_TYPES = [
    'data_listcontents',
    'data_addtolist',
    'data_deleteoflist',
    'data_deletealloflist',
    'data_insertatlist',
    'data_replaceitemoflist',
    'data_itemoflist',
    'data_itemnumoflist',
    'data_lengthoflist',
    'data_listcontainsitem',
    'data_showlist',
    'data_hidelist'
];

const hasAnyBlockType = (allowedBlockTypes, blockTypes) =>
    blockTypes.some(blockType => allowedBlockTypes.has(blockType));

const hasVariableBlock = allowedBlockTypes =>
    hasAnyBlockType(allowedBlockTypes, VARIABLE_BLOCK_TYPES);

const hasListBlock = allowedBlockTypes =>
    hasAnyBlockType(allowedBlockTypes, LIST_BLOCK_TYPES);

const isDynamicDataBlockAllowed = (blockType, allowedBlockTypes) => {
    if (allowedBlockTypes.has(blockType)) return true;
    if (blockType === 'data_variable') return hasVariableBlock(allowedBlockTypes);
    if (blockType === 'data_listcontents') return hasListBlock(allowedBlockTypes);
    return false;
};

const isCustomCategoryAllowed = (customType, allowedBlockTypes) => {
    if (customType === 'VARIABLE') {
        return hasVariableBlock(allowedBlockTypes) || hasListBlock(allowedBlockTypes);
    }
    if (customType === 'PROCEDURE') {
        return Array.from(allowedBlockTypes).some(blockType => blockType.startsWith('procedures_'));
    }
    return true;
};

const hasDirectBlock = category => getElementChildren(category)
    .some(child => getTagName(child) === 'block');

/**
 * Filter the static blocks in a Scratch toolbox XML document.
 * Dynamic variable and procedure categories are filtered by their Blockly callbacks.
 * @param {string} toolboxXML Toolbox XML to filter.
 * @param {string[]} blockTypesToShow Allowed block opcodes; an empty or undefined list disables filtering.
 * Custom blocks use `procedures_call:<proccode>` or `procedures_definition:<proccode>`.
 * Variable and list reporters remain available when any block of their kind is allowed.
 * @returns {string} Filtered toolbox XML.
 */
const filterToolboxXML = (toolboxXML, blockTypesToShow) => {
    if (!toolboxXML || !blockTypesToShow || blockTypesToShow.length === 0) return toolboxXML;

    const allowedBlockTypes = new Set(blockTypesToShow);
    const document = new DOMParser().parseFromString(toolboxXML, 'application/xml');
    if (document.getElementsByTagName('parsererror').length > 0) return toolboxXML;

    Array.from(document.getElementsByTagName('category')).forEach(category => {
        if (!category.parentNode) return;
        const customType = category.getAttribute('custom');
        if (customType && !isCustomCategoryAllowed(customType, allowedBlockTypes)) {
            category.parentNode.removeChild(category);
            return;
        }

        getElementChildren(category).forEach(child => {
            if (getTagName(child) !== 'block') return;
            const blockType = child.getAttribute('type');
            if (!allowedBlockTypes.has(blockType)) {
                category.removeChild(child);
            }
        });

        if (!hasDirectBlock(category) && !customType) {
            category.parentNode.removeChild(category);
        }
    });

    if (document.getElementsByTagName('category').length === 0) return toolboxXML;
    return new XMLSerializer().serializeToString(document.documentElement);
};

export const filterProcedureFlyout = (xmlList, blockTypesToShow) => {
    if (!blockTypesToShow || blockTypesToShow.length === 0) return xmlList;

    const allowedBlockTypes = new Set(blockTypesToShow);
    return xmlList.filter(xml => {
        if (getTagName(xml) === 'button') {
            // Keep the action that creates the dynamic category's allowed blocks.
            return xml.getAttribute('callbackKey') === 'CREATE_PROCEDURE' &&
                isCustomCategoryAllowed('PROCEDURE', allowedBlockTypes);
        }
        if (getTagName(xml) !== 'block') return true;
        const mutation = xml.getElementsByTagName('mutation')[0];
        const proccode = mutation && mutation.getAttribute('proccode');
        return proccode && (allowedBlockTypes.has(`procedures_call:${proccode}`) ||
            allowedBlockTypes.has(`procedures_definition:${proccode}`));
    });
};

export const filterDataFlyout = (xmlList, blockTypesToShow) => {
    if (!blockTypesToShow || blockTypesToShow.length === 0) return xmlList;

    const allowedBlockTypes = new Set(blockTypesToShow);
    return xmlList.filter(xml => {
        const tagName = getTagName(xml);
        if (tagName === 'button') {
            // Keep only the creation actions needed by the allowed block types.
            const callbackKey = xml.getAttribute('callbackKey');
            if (callbackKey === 'CREATE_VARIABLE') return hasVariableBlock(allowedBlockTypes);
            if (callbackKey === 'CREATE_LIST') return hasListBlock(allowedBlockTypes);
            return false;
        }
        if (tagName === 'sep') return true;
        if (tagName !== 'block') return true;
        return isDynamicDataBlockAllowed(xml.getAttribute('type'), allowedBlockTypes);
    });
};

export default filterToolboxXML;
