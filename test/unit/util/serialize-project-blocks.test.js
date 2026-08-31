import VM from 'scratch-vm';
import ScratchBlocks from 'scratch-blocks';

import serializeProjectBlocks from '../../../src/lib/serialize-project-blocks';

const numberInput = value => [1, [4, value]];
const textInput = value => [1, [10, value]];

const createCostume = () => ({
    assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
    name: 'costume',
    bitmapResolution: 1,
    md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
    dataFormat: 'svg',
    rotationCenterX: 0,
    rotationCenterY: 0
});

const createProject = ({
    spriteBlocks = {},
    spriteVariables = {},
    stageBlocks = {},
    stageVariables = {}
} = {}) => ({
    targets: [{
        isStage: true,
        name: 'Stage',
        variables: stageVariables,
        lists: {},
        broadcasts: {},
        blocks: stageBlocks,
        comments: {},
        currentCostume: 0,
        costumes: [createCostume()],
        sounds: [],
        volume: 100,
        layerOrder: 0,
        tempo: 60,
        videoTransparency: 50,
        videoState: 'on',
        textToSpeechLanguage: null
    }, {
        isStage: false,
        name: 'Sprite1',
        variables: spriteVariables,
        lists: {},
        broadcasts: {},
        blocks: spriteBlocks,
        comments: {},
        currentCostume: 0,
        costumes: [createCostume()],
        sounds: [],
        volume: 100,
        layerOrder: 1,
        visible: true,
        x: 0,
        y: 0,
        size: 100,
        direction: 90,
        draggable: false,
        rotationStyle: 'all around'
    }],
    monitors: [],
    extensions: [],
    meta: {
        semver: '3.0.0',
        vm: '0.2.0',
        agent: 'serialize-project-blocks test'
    }
});

const loadAndSerialize = async project => {
    const vm = new VM();
    await vm.loadProject(project);
    return serializeProjectBlocks(vm);
};

describe('serializeProjectBlocks', () => {
    test('orders top-level scripts by y and then x coordinates', async () => {
        const previousMainWorkspace = ScratchBlocks.mainWorkspace;
        const result = await loadAndSerialize(createProject({
            spriteBlocks: {
                bottom: {
                    opcode: 'looks_say',
                    next: null,
                    parent: null,
                    inputs: {MESSAGE: textInput('bottom')},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 20,
                    y: 200
                },
                topRight: {
                    opcode: 'looks_say',
                    next: null,
                    parent: null,
                    inputs: {MESSAGE: textInput('right')},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 200,
                    y: 20
                },
                topLeft: {
                    opcode: 'looks_say',
                    next: null,
                    parent: null,
                    inputs: {MESSAGE: textInput('left')},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 20,
                    y: 20
                }
            }
        }));

        expect(result.targets[1].threads).toEqual([{
            firstBlockId: 'topLeft',
            text: '<say left>'
        }, {
            firstBlockId: 'topRight',
            text: '<say right>'
        }, {
            firstBlockId: 'bottom',
            text: '<say bottom>'
        }]);
        expect(ScratchBlocks.mainWorkspace).toBe(previousMainWorkspace);
    });

    test('serializes connected stacks, nested reporters, empty inputs and C-block bodies', async () => {
        const result = await loadAndSerialize(createProject({
            spriteBlocks: {
                hat: {
                    opcode: 'event_whenflagclicked',
                    next: 'repeat',
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 10,
                    y: 10
                },
                repeat: {
                    opcode: 'control_repeat',
                    next: 'if',
                    parent: 'hat',
                    inputs: {
                        TIMES: numberInput(2),
                        SUBSTACK: [2, 'move']
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                move: {
                    opcode: 'motion_movesteps',
                    next: 'say',
                    parent: 'repeat',
                    inputs: {STEPS: numberInput(10)},
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                say: {
                    opcode: 'looks_say',
                    next: null,
                    parent: 'move',
                    inputs: {MESSAGE: textInput('inside')},
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                if: {
                    opcode: 'control_if',
                    next: null,
                    parent: 'repeat',
                    inputs: {
                        CONDITION: [2, 'greater'],
                        SUBSTACK: [2, 'think']
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                greater: {
                    opcode: 'operator_gt',
                    next: null,
                    parent: 'if',
                    inputs: {OPERAND1: numberInput(5)},
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                think: {
                    opcode: 'looks_thinkforsecs',
                    next: null,
                    parent: 'if',
                    inputs: {
                        MESSAGE: textInput('done'),
                        SECS: numberInput(1)
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                }
            }
        }));

        expect(result.targets[1].threads).toEqual([{
            firstBlockId: 'hat',
            text: [
                '<when clicked>',
                '<repeat 2>:',
                '\t<move 10 steps>',
                '\t<say inside>',
                '<if <5 > (빈 칸)> then>:',
                '\t<think done for 1 seconds>'
            ].join('\n')
        }]);
    });

    test('serializes stage and sprite variables through the real VM XML boundary', async () => {
        const result = await loadAndSerialize(createProject({
            stageVariables: {score: ['score', 0]},
            spriteVariables: {lives: ['lives', 3]},
            spriteBlocks: {
                setScore: {
                    opcode: 'data_setvariableto',
                    next: 'changeLives',
                    parent: null,
                    inputs: {VALUE: numberInput(1)},
                    fields: {VARIABLE: ['score', 'score']},
                    shadow: false,
                    topLevel: true,
                    x: 10,
                    y: 10
                },
                changeLives: {
                    opcode: 'data_changevariableby',
                    next: null,
                    parent: 'setScore',
                    inputs: {VALUE: numberInput(-1)},
                    fields: {VARIABLE: ['lives', 'lives']},
                    shadow: false,
                    topLevel: false
                }
            }
        }));

        expect(result.targets[1].threads).toEqual([{
            firstBlockId: 'setScore',
            text: '<set [score] to 1>\n<change [lives] by -1>'
        }]);
    });

    test('rejects a value without a VM runtime', () => {
        expect(() => serializeProjectBlocks(null)).toThrow(TypeError);
        expect(() => serializeProjectBlocks({})).toThrow(TypeError);
    });
});
