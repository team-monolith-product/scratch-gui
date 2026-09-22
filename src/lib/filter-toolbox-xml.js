const ELEMENT_NODE = 1;

const getElementChildren = element => Array.from(element.childNodes)
    .filter(child => child.nodeType === ELEMENT_NODE);

const getTagName = element => element.tagName.toLowerCase();

const hasBlockType = (allowedBlockTypes, blockType) => allowedBlockTypes.has(blockType);

const hasVariableBlock = allowedBlockTypes => Array.from(allowedBlockTypes)
    .some(blockType => blockType === 'data_variable' || blockType === 'data_setvariableto' ||
        blockType === 'data_changevariableby' || blockType === 'data_showvariable' ||
        blockType === 'data_hidevariable');

const hasListBlock = allowedBlockTypes => Array.from(allowedBlockTypes)
    .some(blockType => blockType === 'data_listcontents' || blockType === 'data_addtolist' ||
        blockType === 'data_deleteoflist' || blockType === 'data_deletealloflist' ||
        blockType === 'data_insertatlist' || blockType === 'data_replaceitemoflist' ||
        blockType === 'data_itemoflist' || blockType === 'data_itemnumoflist' ||
        blockType === 'data_lengthoflist' || blockType === 'data_listcontainsitem' ||
        blockType === 'data_showlist' || blockType === 'data_hidelist');

const isDynamicDataBlockAllowed = (blockType, allowedBlockTypes) => {
    if (hasBlockType(allowedBlockTypes, blockType)) return true;
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
 * @param {string[]} blockTypesToShow Block types allowed in the toolbox.
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
            if (customType === 'VARIABLE' ?
                !isDynamicDataBlockAllowed(blockType, allowedBlockTypes) :
                !hasBlockType(allowedBlockTypes, blockType)) {
                category.removeChild(child);
            }
        });

        if (!hasDirectBlock(category) && !customType) {
            category.parentNode.removeChild(category);
        }
    });

    return new XMLSerializer().serializeToString(document.documentElement);
};

export const filterProcedureFlyout = (xmlList, blockTypesToShow) => {
    if (!blockTypesToShow || blockTypesToShow.length === 0) return xmlList;

    const allowedBlockTypes = new Set(blockTypesToShow);
    return xmlList.filter(xml => {
        if (getTagName(xml) === 'button') return false;
        if (getTagName(xml) !== 'block') return true;
        const mutation = xml.getElementsByTagName('mutation')[0];
        const proccode = mutation && mutation.getAttribute('proccode');
        return proccode && (hasBlockType(allowedBlockTypes, `procedures_call:${proccode}`) ||
            hasBlockType(allowedBlockTypes, `procedures_definition:${proccode}`));
    });
};

export const filterDataFlyout = (xmlList, blockTypesToShow) => {
    if (!blockTypesToShow || blockTypesToShow.length === 0) return xmlList;

    const allowedBlockTypes = new Set(blockTypesToShow);
    return xmlList.filter(xml => {
        const tagName = getTagName(xml);
        if (tagName === 'button') return false;
        if (tagName === 'sep') return true;
        if (tagName !== 'block') return true;
        return isDynamicDataBlockAllowed(xml.getAttribute('type'), allowedBlockTypes);
    });
};

export default filterToolboxXML;
