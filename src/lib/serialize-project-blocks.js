import editorMessages from 'scratch-l10n/locales/editor-msgs';

const EMPTY_INPUT_MESSAGE = 'gui.monitor.listMonitor.empty';
const SIGNATURE_INPUT = 'custom_block';
const serializerContexts = new WeakMap();

export const registerProjectSerializerContext = (vm, ScratchBlocks) => {
    serializerContexts.set(vm, ScratchBlocks);
};

export const unregisterProjectSerializerContext = (vm, ScratchBlocks) => {
    if (serializerContexts.get(vm) === ScratchBlocks) {
        serializerContexts.delete(vm);
    }
};

const emptyInputText = locale => {
    const messages = editorMessages[locale] || editorMessages.en || {};
    return messages[EMPTY_INPUT_MESSAGE] || '(empty)';
};

const isBodyInput = (ScratchBlocks, input) => (
    input.type === ScratchBlocks.NEXT_STATEMENT && input.name !== SIGNATURE_INPUT
);

const fieldText = (ScratchBlocks, field) => {
    if (ScratchBlocks.FieldImage && field instanceof ScratchBlocks.FieldImage) {
        return null;
    }

    const text = field.getText();
    if (!text) return null;

    return ScratchBlocks.FieldDropdown && field instanceof ScratchBlocks.FieldDropdown ?
        `[${text}]` : text;
};

const createBlockTextSerializer = (ScratchBlocks, emptyInput) => {
    const serializeStack = (firstBlock, wrap = true) => {
        const lines = [];
        const visited = new Set();
        for (let block = firstBlock; block && !visited.has(block.id); block = block.getNextBlock()) {
            visited.add(block.id);
            const segments = [];
            let parts = [];

            block.inputList.forEach(input => {
                if (isBodyInput(ScratchBlocks, input)) {
                    const child = input.connection && input.connection.targetBlock();
                    segments.push({
                        parts,
                        body: serializeStack(child)
                    });
                    parts = [];
                    return;
                }

                input.fieldRow.forEach(field => {
                    const text = fieldText(ScratchBlocks, field);
                    if (text !== null) parts.push(text);
                });

                if (!input.connection) return;

                const child = input.connection.targetBlock();
                if (!child) {
                    parts.push(emptyInput);
                    return;
                }
                parts.push(serializeStack(child, !child.isShadow()));
            });

            if (parts.length > 0) {
                segments.push({parts, body: null});
            }

            if (segments.length === 0) {
                lines.push('<>');
                continue;
            }

            lines.push(segments.map((segment, index) => {
                const head = (index === 0 && wrap) ?
                    `<${segment.parts.join(' ')}>` : segment.parts.join(' ');
                if (segment.body === null) return head;
                if (segment.body === '') return `${head}:`;
                const body = segment.body
                    .split('\n')
                    .map(line => (line === '' ? line : `\t${line}`))
                    .join('\n');
                return `${head}:\n${body}`;
            }).join('\n'));
        }
        return lines.join('\n');
    };

    return serializeStack;
};

const workspaceXml = (target, stage) => {
    const globalVariables = stage && stage.variables ?
        Object.keys(stage.variables).map(id => stage.variables[id].toXML()) : [];
    const localVariables = target.isStage || !target.variables ? [] :
        Object.keys(target.variables).map(id => target.variables[id].toXML(true));
    const variables = globalVariables.concat(localVariables).join('');
    const blocks = target.blocks.toXML(target.comments);

    return `<xml xmlns="http://www.w3.org/1999/xhtml"><variables>${variables}</variables>${blocks}</xml>`;
};

const coordinate = (block, name) => (block ? (block[name] || 0) : 0);

const topBlockIds = blocks => blocks.getScripts().slice()
    .sort((leftId, rightId) => {
        const left = blocks.getBlock(leftId);
        const right = blocks.getBlock(rightId);
        return coordinate(left, 'y') - coordinate(right, 'y') ||
            coordinate(left, 'x') - coordinate(right, 'x');
    });

const serializeTarget = (ScratchBlocks, target, stage, emptyInput) => {
    const previousMainWorkspace = ScratchBlocks.mainWorkspace;
    const workspace = new ScratchBlocks.Workspace({
        pathToMedia: previousMainWorkspace ? previousMainWorkspace.options.pathToMedia : ''
    });
    ScratchBlocks.mainWorkspace = workspace;
    try {
        const dom = ScratchBlocks.Xml.textToDom(workspaceXml(target, stage));
        ScratchBlocks.Xml.domToWorkspace(dom, workspace);
        const serializeBlockStack = createBlockTextSerializer(ScratchBlocks, emptyInput);

        return {
            name: target.getName(),
            isStage: target.isStage,
            threads: topBlockIds(target.blocks).map(firstBlockId => {
                const firstBlock = workspace.getBlockById(firstBlockId);
                return {
                    firstBlockId,
                    llmReadyCode: firstBlock ? serializeBlockStack(firstBlock) : ''
                };
            })
        };
    } finally {
        try {
            workspace.dispose();
        } finally {
            ScratchBlocks.mainWorkspace = previousMainWorkspace;
        }
    }
};

const serializeProjectBlocks = vm => {
    if (!vm || !vm.runtime) {
        throw new TypeError('serializeProjectBlocks requires a VM with a runtime');
    }

    const ScratchBlocks = serializerContexts.get(vm);
    if (!ScratchBlocks) {
        throw new Error('serializeProjectBlocks requires a mounted Blocks workspace');
    }

    const stage = vm.runtime.getTargetForStage();
    const targets = vm.runtime.targets.filter(target => target.isOriginal);
    const locale = (vm.getLocale && vm.getLocale()) || 'en';
    const emptyInput = emptyInputText(locale);

    return {
        targets: targets.map((target, index) => ({
            index,
            ...serializeTarget(ScratchBlocks, target, stage, emptyInput)
        }))
    };
};

export default serializeProjectBlocks;
