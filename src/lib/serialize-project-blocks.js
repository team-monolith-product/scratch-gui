import editorMessages from 'scratch-l10n/locales/editor-msgs';

const EMPTY_INPUT_MESSAGE = 'gui.monitor.listMonitor.empty';

const emptyInputText = locale => {
    const messages = editorMessages[locale] || editorMessages.en || {};
    return messages[EMPTY_INPUT_MESSAGE] || '(empty)';
};

const workspaceXml = (target, stage) => {
    const globalVariables = stage && stage.variables ?
        Object.keys(stage.variables).map(id => stage.variables[id].toXML()) : [];
    const localVariables = target.isStage || !target.variables ? [] :
        Object.keys(target.variables).map(id => target.variables[id].toXML(true));

    return `<xml xmlns="http://www.w3.org/1999/xhtml"><variables>${
        globalVariables.concat(localVariables).join('')
    }</variables>${target.blocks.toXML(target.comments)}</xml>`;
};

const stackText = (firstBlock, emptyInput) => {
    const lines = [];
    const appendBlock = (block, includeText = true) => {
        if (!block) return;

        if (includeText) {
            lines.push(block.toString(null, emptyInput));
        }

        const nextBlock = block.getNextBlock();
        block.getChildren(true)
            .filter(child => child !== nextBlock && !child.isShadow() && !child.outputConnection)
            .forEach(child => appendBlock(child, false));
        appendBlock(nextBlock);
    };

    appendBlock(firstBlock);
    return lines.join('\n');
};

const serializeTarget = (ScratchBlocks, target, stage, emptyInput) => {
    const previousMainWorkspace = ScratchBlocks.mainWorkspace;
    const workspace = new ScratchBlocks.Workspace({
        pathToMedia: previousMainWorkspace ? previousMainWorkspace.options.pathToMedia : ''
    });
    ScratchBlocks.mainWorkspace = workspace;

    try {
        const dom = ScratchBlocks.Xml.textToDom(workspaceXml(target, stage));
        ScratchBlocks.Xml.domToWorkspace(dom, workspace);

        return {
            name: target.getName(),
            isStage: target.isStage,
            threads: workspace.getTopBlocks(true).map(firstBlock => ({
                firstBlockId: firstBlock.id,
                llmReadyCode: stackText(firstBlock, emptyInput)
            }))
        };
    } finally {
        try {
            workspace.dispose();
        } finally {
            ScratchBlocks.mainWorkspace = previousMainWorkspace;
        }
    }
};

const serializeProjectBlocks = (vm, ScratchBlocks) => {
    if (!vm || !vm.runtime) {
        throw new TypeError('serializeProjectBlocks requires a VM with a runtime');
    }
    if (!ScratchBlocks || !ScratchBlocks.Workspace || !ScratchBlocks.Xml) {
        throw new TypeError('serializeProjectBlocks requires the GUI ScratchBlocks instance');
    }

    const stage = vm.runtime.getTargetForStage();
    const emptyInput = emptyInputText((vm.getLocale && vm.getLocale()) || 'en');

    return {
        targets: vm.runtime.targets.filter(target => target.isOriginal).map((target, index) => ({
            index,
            ...serializeTarget(ScratchBlocks, target, stage, emptyInput)
        }))
    };
};

export default serializeProjectBlocks;
