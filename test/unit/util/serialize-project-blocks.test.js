import VM from 'scratch-vm';

import VMScratchBlocks from '../../../src/lib/blocks';
import serializeProjectBlocks from '../../../src/lib/serialize-project-blocks';

const createBlock = ({
    id,
    isShadow = false,
    outputConnection = null,
    text
}) => ({
    getChildren: jest.fn(() => []),
    getNextBlock: jest.fn(() => null),
    id,
    isShadow: jest.fn(() => isShadow),
    outputConnection,
    toString: jest.fn(() => text)
});

const createHarness = ({locale = 'en', loadError} = {}) => {
    const firstBlock = createBlock({id: 'hat', text: 'when flag clicked'});
    const shadowBlock = createBlock({id: 'shadow', isShadow: true, text: '10'});
    const reporterBlock = createBlock({id: 'reporter', outputConnection: {}, text: 'x position'});
    const nextBlock = createBlock({id: 'move', text: 'move 10 steps'});
    firstBlock.getChildren.mockReturnValue([shadowBlock, reporterBlock, nextBlock]);
    firstBlock.getNextBlock.mockReturnValue(nextBlock);

    const workspace = {
        dispose: jest.fn(),
        getTopBlocks: jest.fn(() => [firstBlock])
    };
    const previousMainWorkspace = {options: {pathToMedia: '/blocks-media/'}};
    const dom = {};
    const ScratchBlocks = {
        mainWorkspace: previousMainWorkspace,
        Workspace: jest.fn(() => workspace),
        Xml: {
            domToWorkspace: loadError ? jest.fn(() => {
                throw loadError;
            }) : jest.fn(),
            textToDom: jest.fn(() => dom)
        }
    };
    const stageVariable = {toXML: jest.fn(() => '<variable id="score">score</variable>')};
    const localVariable = {toXML: jest.fn(() => '<variable id="lives">lives</variable>')};
    const stage = {
        variables: {score: stageVariable}
    };
    const target = {
        blocks: {toXML: jest.fn(() => '<block id="hat"/>')},
        comments: {},
        getName: jest.fn(() => 'Sprite1'),
        isOriginal: true,
        isStage: false,
        variables: {lives: localVariable}
    };
    const vm = {
        getLocale: jest.fn(() => locale),
        runtime: {
            getTargetForStage: jest.fn(() => stage),
            targets: [target, {isOriginal: false}]
        }
    };

    return {
        dom,
        firstBlock,
        localVariable,
        nextBlock,
        previousMainWorkspace,
        ScratchBlocks,
        stageVariable,
        target,
        vm,
        workspace
    };
};

describe('serializeProjectBlocks', () => {
    test('uses Blockly ordering and text APIs to build the public contract', () => {
        const harness = createHarness();

        const result = serializeProjectBlocks(harness.vm, harness.ScratchBlocks);

        expect(result).toEqual({
            targets: [{
                index: 0,
                name: 'Sprite1',
                isStage: false,
                threads: [{
                    firstBlockId: 'hat',
                    llmReadyCode: 'when flag clicked\nmove 10 steps'
                }]
            }]
        });
        expect(harness.workspace.getTopBlocks).toHaveBeenCalledWith(true);
        expect(harness.firstBlock.getChildren).toHaveBeenCalledWith(true);
        expect(harness.firstBlock.toString).toHaveBeenCalledWith(null, '(empty)');
        expect(harness.nextBlock.toString).toHaveBeenCalledWith(null, '(empty)');
        expect(harness.ScratchBlocks.Workspace).toHaveBeenCalledWith({pathToMedia: '/blocks-media/'});
        expect(harness.ScratchBlocks.Xml.domToWorkspace)
            .toHaveBeenCalledWith(harness.dom, harness.workspace);
        expect(harness.ScratchBlocks.Xml.textToDom.mock.calls[0][0]).toContain(
            '<variable id="score">score</variable><variable id="lives">lives</variable>'
        );
        expect(harness.stageVariable.toXML).toHaveBeenCalledWith();
        expect(harness.localVariable.toXML).toHaveBeenCalledWith(true);
        expect(harness.workspace.dispose).toHaveBeenCalledWith();
        expect(harness.ScratchBlocks.mainWorkspace).toBe(harness.previousMainWorkspace);
    });

    test('keeps a top-level reporter as a non-empty thread', () => {
        const harness = createHarness();
        const reporter = createBlock({id: 'reporter', outputConnection: {}, text: 'x position'});
        harness.workspace.getTopBlocks.mockReturnValue([reporter]);

        const result = serializeProjectBlocks(harness.vm, harness.ScratchBlocks);

        expect(result.targets[0].threads).toEqual([{
            firstBlockId: 'reporter',
            llmReadyCode: 'x position'
        }]);
    });

    test('serializes real ScratchBlocks without duplicating a C-block body', () => {
        const vm = new VM();
        const ScratchBlocks = VMScratchBlocks(vm, false);
        const target = {
            blocks: {toXML: () => `
                <block type="event_whenflagclicked" id="hat" x="10" y="10">
                    <next>
                        <block type="control_repeat" id="repeat">
                            <value name="TIMES">
                                <shadow type="math_whole_number" id="times">
                                    <field name="NUM">2</field>
                                </shadow>
                            </value>
                            <statement name="SUBSTACK">
                                <block type="motion_movesteps" id="move">
                                    <value name="STEPS">
                                        <shadow type="math_number" id="steps">
                                            <field name="NUM">10</field>
                                        </shadow>
                                    </value>
                                    <next>
                                        <block type="looks_say" id="say">
                                            <value name="MESSAGE">
                                                <shadow type="text" id="message">
                                                    <field name="TEXT">inside</field>
                                                </shadow>
                                            </value>
                                        </block>
                                    </next>
                                </block>
                            </statement>
                            <next>
                                <block type="looks_think" id="think">
                                    <value name="MESSAGE">
                                        <shadow type="text" id="thought">
                                            <field name="TEXT">after</field>
                                        </shadow>
                                    </value>
                                </block>
                            </next>
                        </block>
                    </next>
                </block>
                <block type="motion_xposition" id="reporter" x="10" y="200" />`},
            comments: {},
            getName: () => 'Sprite1',
            isOriginal: true,
            isStage: false,
            variables: {}
        };
        vm.runtime.targets = [target];
        vm.runtime.getTargetForStage = () => null;

        const result = serializeProjectBlocks(vm, ScratchBlocks);

        expect(result.targets[0].threads).toEqual([{
            firstBlockId: 'hat',
            llmReadyCode: [
                'when flag clicked',
                'repeat 2 move 10 steps *',
                'say inside',
                'think after'
            ].join('\n')
        }, {
            firstBlockId: 'reporter',
            llmReadyCode: 'x position'
        }]);
    });

    test('passes the localized empty-input label to Blockly', () => {
        const harness = createHarness({locale: 'ko'});

        serializeProjectBlocks(harness.vm, harness.ScratchBlocks);

        expect(harness.firstBlock.toString).toHaveBeenCalledWith(null, '(비어 있음)');
    });

    test('restores Blockly state when loading the workspace fails', () => {
        const loadError = new Error('invalid block XML');
        const harness = createHarness({loadError});

        expect(() => serializeProjectBlocks(harness.vm, harness.ScratchBlocks)).toThrow(loadError);
        expect(harness.workspace.dispose).toHaveBeenCalledWith();
        expect(harness.ScratchBlocks.mainWorkspace).toBe(harness.previousMainWorkspace);
    });

    test('rejects missing dependencies', () => {
        expect(() => serializeProjectBlocks(null)).toThrow(/VM/);
        expect(() => serializeProjectBlocks({})).toThrow(/VM/);

        const vm = {runtime: {}};
        expect(() => serializeProjectBlocks(vm)).toThrow(/ScratchBlocks/);
    });
});
