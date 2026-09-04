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

const statementBodyInputs = (ScratchBlocks, block) =>
    block.inputList.filter(input =>
        input.type === ScratchBlocks.NEXT_STATEMENT && input.name !== 'custom_block'
    );

const blockText = (ScratchBlocks, block, emptyInput) => {
    const statementInputs = statementBodyInputs(ScratchBlocks, block);
    if (statementInputs.length === 0) {
        return block.toString(null, emptyInput);
    }

    const blockWithoutStatementBodies = Object.create(block);
    blockWithoutStatementBodies.inputList = block.inputList.map(input => {
        if (input.type !== ScratchBlocks.NEXT_STATEMENT || input.name === 'custom_block') return input;
        const inputWithoutConnection = Object.create(input);
        inputWithoutConnection.connection = null;
        return inputWithoutConnection;
    });
    return blockWithoutStatementBodies.toString(null, emptyInput);
};

const stackText = (ScratchBlocks, firstBlock, emptyInput) => {
    const lines = [];
    const appendStack = (firstBlockInStack, depth) => {
        let block = firstBlockInStack;
        while (block) {
            const indentation = '  '.repeat(depth);
            lines.push(`${indentation}${blockText(ScratchBlocks, block, emptyInput)}`);

            statementBodyInputs(ScratchBlocks, block).forEach(input => {
                lines.push(`${indentation}  ${input.name} {`);
                const child = input.connection.targetBlock();
                if (child) {
                    appendStack(child, depth + 2);
                } else {
                    lines.push(`${indentation}    ${emptyInput}`);
                }
                lines.push(`${indentation}  }`);
            });
            block = block.getNextBlock();
        }
    };

    appendStack(firstBlock, 0);
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
                llmReadyCode: stackText(ScratchBlocks, firstBlock, emptyInput)
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
