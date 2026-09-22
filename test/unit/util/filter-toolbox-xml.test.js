import filterToolboxXML, {
    filterDataFlyout,
    filterProcedureFlyout
} from '../../../src/lib/filter-toolbox-xml';

const parseXml = xml => new DOMParser().parseFromString(xml, 'application/xml');

beforeEach(() => {
    global.XMLSerializer = class {
        serializeToString (element) {
            return element.outerHTML;
        }
    };
});

afterEach(() => {
    delete global.XMLSerializer;
});

describe('filterToolboxXML', () => {
    test('keeps only the allowed static blocks and categories', () => {
        const toolboxXML = `
            <xml>
                <category name="Motion">
                    <block type="motion_movesteps" />
                    <block type="motion_turnright" />
                </category>
                <category name="Looks">
                    <block type="looks_say" />
                </category>
            </xml>
        `;

        const filtered = parseXml(filterToolboxXML(toolboxXML, ['motion_movesteps']));

        expect(filtered.getElementsByTagName('block')).toHaveLength(1);
        expect(filtered.getElementsByTagName('block')[0].getAttribute('type'))
            .toBe('motion_movesteps');
        expect(filtered.getElementsByTagName('category')).toHaveLength(1);
        expect(filtered.getElementsByTagName('category')[0].getAttribute('name')).toBe('Motion');
    });

    test('does not filter when no block list is supplied', () => {
        const toolboxXML = '<xml><category name="Motion"><block type="motion_movesteps" /></category></xml>';

        expect(filterToolboxXML(toolboxXML)).toBe(toolboxXML);
        expect(filterToolboxXML(toolboxXML, [])).toBe(toolboxXML);
    });
});

describe('filterProcedureFlyout', () => {
    test('keeps procedure blocks whose call or definition is in the solution', () => {
        const xmlList = [
            parseXml('<block type="procedures_call"><mutation proccode="move %s steps" /></block>')
                .documentElement,
            parseXml('<block type="procedures_call"><mutation proccode="say hello" /></block>')
                .documentElement,
            parseXml('<button text="Make a block" callbackKey="MAKE_A_PROCEDURE" />')
                .documentElement
        ];

        const filtered = filterProcedureFlyout(xmlList, ['procedures_definition:move %s steps']);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].getElementsByTagName('mutation')[0].getAttribute('proccode'))
            .toBe('move %s steps');
    });
});

describe('filterDataFlyout', () => {
    test('keeps variable and list flyout blocks when their operations are used', () => {
        const xmlList = [
            parseXml('<button text="Make a variable" callbackKey="MAKE_A_VARIABLE" />')
                .documentElement,
            parseXml('<block type="data_variable" />').documentElement,
            parseXml('<block type="data_listcontents" />').documentElement,
            parseXml('<block type="data_showvariable" />').documentElement
        ];

        const filtered = filterDataFlyout(xmlList, ['data_showvariable']);

        expect(filtered.map(xml => xml.getAttribute('type'))).toEqual(['data_variable', 'data_showvariable']);
    });
});
