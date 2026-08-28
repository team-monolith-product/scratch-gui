import serializeProjectBlocks from '../../../src/lib/serialize-project-blocks';

const blockXml = `
    <block type="motion_movesteps" id="move" x="10" y="20">
        <value name="STEPS">
            <shadow type="math_number" id="steps">
                <field name="NUM">10</field>
            </shadow>
        </value>
    </block>
    <block type="test_choose" id="choose" x="10" y="40">
        <value name="CHOICE">
            <shadow type="test_menu" id="menu">
                <field name="CHOICE">internal</field>
            </shadow>
        </value>
    </block>`;

const createVm = () => {
    const targetBlock = {
        id: 'move',
        x: 10,
        y: 20
    };
    const chooseBlock = {
        id: 'choose',
        x: 10,
        y: 40
    };
    const target = {
        isOriginal: true,
        isStage: false,
        getName: () => 'Sprite1',
        blocks: {
            getScripts: () => ['move', 'choose'],
            getBlock: id => id === targetBlock.id ? targetBlock :
                (id === chooseBlock.id ? chooseBlock : undefined),
            toXML: () => blockXml
        }
    };
    const runtime = {
        _blockInfo: [{
            id: 'test',
            name: 'Test',
            color1: '#000000',
            color2: '#111111',
            color3: '#222222',
            blocks: [{
                json: {
                    type: 'test_choose',
                    message0: '%1 choose',
                    args0: [{
                        type: 'input_value',
                        name: 'CHOICE'
                    }]
                }
            }],
            menus: [{
                json: {
                    type: 'test_menu',
                    message0: '%1',
                    args0: [{
                        type: 'field_dropdown',
                        name: 'CHOICE',
                        options: [['display', 'internal']]
                    }],
                    output: 'String'
                }
            }],
            customFieldTypes: {}
        }],
        flyoutBlocks: {_blocks: {}},
        monitorBlocks: {_blocks: {}},
        targets: [target],
        getTargetForStage: () => undefined
    };

    return {
        editingTarget: undefined,
        getLocale: () => 'en',
        getPeripheralIsConnected: () => false,
        runtime
    };
};

describe('serializeProjectBlocks', () => {
    test('returns plain text without exposing Blockly objects', () => {
        const result = serializeProjectBlocks(createVm());

        expect(result).toEqual({
            targets: [{
                index: 0,
                name: 'Sprite1',
                isStage: false,
                threads: [{
                    firstBlockId: 'move',
                    text: '<move 10 steps>'
                }, {
                    firstBlockId: 'choose',
                    text: '<[display] choose>'
                }]
            }]
        });
    });
});
