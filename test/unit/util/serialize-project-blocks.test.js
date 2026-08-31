import VM from 'scratch-vm';
import ScratchBlocks from 'scratch-blocks';
import editorMessages from 'scratch-l10n/locales/editor-msgs';

import VMScratchBlocks from '../../../src/lib/blocks';
import {registerExtensionBlocks} from '../../../src/lib/register-extension-blocks';
import serializeProjectBlocks, {
    registerProjectSerializerContext,
    unregisterProjectSerializerContext
} from '../../../src/lib/serialize-project-blocks';

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
    extensions = [],
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
    extensions,
    meta: {
        semver: '3.0.0',
        vm: '0.2.0',
        agent: 'serialize-project-blocks test'
    }
});

const loadAndSerialize = async (project, locale = 'en') => {
    const vm = new VM();
    const configuredScratchBlocks = VMScratchBlocks(vm, false);
    vm.on('EXTENSION_ADDED', categoryInfo => {
        registerExtensionBlocks(configuredScratchBlocks, categoryInfo, null);
    });
    await vm.loadProject(project);
    configuredScratchBlocks.ScratchMsgs.setLocale(locale);
    await vm.setLocale(locale, editorMessages[locale]);
    registerProjectSerializerContext(vm, configuredScratchBlocks);
    try {
        return serializeProjectBlocks(vm);
    } finally {
        unregisterProjectSerializerContext(vm, configuredScratchBlocks);
    }
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
                '<if <5 > (empty)> then>:',
                '\t<think done for 1 seconds>'
            ].join('\n')
        }]);
    });

    test('localizes empty inputs with the same locale as block labels', async () => {
        const result = await loadAndSerialize(createProject({
            spriteBlocks: {
                say: {
                    opcode: 'looks_say',
                    next: null,
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 10,
                    y: 10
                }
            }
        }), 'ko');

        expect(result.targets[1].threads).toEqual([{
            firstBlockId: 'say',
            text: '<(빈 칸) 말하기>'
        }]);
    });

    test('uses extension definitions already registered by the GUI owner', async () => {
        const result = await loadAndSerialize(createProject({
            extensions: ['pen'],
            spriteBlocks: {
                penDown: {
                    opcode: 'pen_penDown',
                    next: null,
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 10,
                    y: 10
                }
            }
        }, 'en'));

        expect(result.targets[1].threads).toEqual([{
            firstBlockId: 'penDown',
            text: '<pen down>'
        }]);
    });

    test('serializes a custom procedure signature, body and call', async () => {
        const mutation = {
            tagName: 'mutation',
            children: [],
            proccode: 'greet',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: 'false'
        };
        const result = await loadAndSerialize(createProject({
            spriteBlocks: {
                definition: {
                    opcode: 'procedures_definition',
                    next: 'body',
                    parent: null,
                    inputs: {custom_block: [1, 'prototype']},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 10,
                    y: 10
                },
                prototype: {
                    opcode: 'procedures_prototype',
                    next: null,
                    parent: 'definition',
                    inputs: {},
                    fields: {},
                    shadow: true,
                    topLevel: false,
                    mutation
                },
                body: {
                    opcode: 'looks_say',
                    next: null,
                    parent: 'definition',
                    inputs: {MESSAGE: textInput('hello')},
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                call: {
                    opcode: 'procedures_call',
                    next: null,
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 10,
                    y: 100,
                    mutation
                }
            }
        }));

        expect(result.targets[1].threads).toEqual([{
            firstBlockId: 'definition',
            text: '<define greet>\n<say hello>'
        }, {
            firstBlockId: 'call',
            text: '<greet>'
        }]);
    });

    test('does not reconfigure global ScratchBlocks while serializing', async () => {
        const vm = new VM();
        const configuredScratchBlocks = VMScratchBlocks(vm, false);
        await vm.loadProject(createProject());
        configuredScratchBlocks.ScratchMsgs.setLocale('en');
        await vm.setLocale('en', editorMessages.en);
        registerProjectSerializerContext(vm, configuredScratchBlocks);
        const soundMenuInitializer = configuredScratchBlocks.Blocks.sound_sounds_menu.init;
        const locale = configuredScratchBlocks.ScratchMsgs.currentLocale_;

        try {
            serializeProjectBlocks(vm);
        } finally {
            unregisterProjectSerializerContext(vm, configuredScratchBlocks);
        }

        expect(configuredScratchBlocks.Blocks.sound_sounds_menu.init).toBe(soundMenuInitializer);
        expect(configuredScratchBlocks.ScratchMsgs.currentLocale_).toBe(locale);
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

    test('rejects a VM without a registered GUI serialization context', () => {
        const vm = new VM();

        expect(() => serializeProjectBlocks(vm)).toThrow(/mounted Blocks workspace/);
    });
});
