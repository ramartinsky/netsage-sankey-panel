import { MappingType, SpecialValueMatch, ValueMapping } from '@grafana/data';
import { getMappedColor } from './nodeColors';

describe('node color mappings', () => {
  const mappings: ValueMapping[] = [
    { type: MappingType.ValueToText, options: { 'Gia Scio': { color: 'green', text: 'Replacement' } } },
    { type: MappingType.RegexToText, options: { pattern: 'Gia.*', result: { color: 'blue' } } },
    { type: MappingType.RegexToText, options: { pattern: '/nov/i', result: { color: 'red' } } },
  ];

  it.each([
    ['Gia Scio', 'green'],
    ['Gia Other', 'blue'],
    ['Nov Edo', 'red'],
    ['prefix Gia Scio', undefined],
    [42, undefined],
    [null, undefined],
  ])('maps %p to %p using the first matching rule', (value, expected) => {
    expect(getMappedColor(mappings, value)).toBe(expected);
  });

  it('stops at a text-only mapping rather than using a later color', () => {
    expect(
      getMappedColor(
        [{ type: MappingType.ValueToText, options: { 'Gia Scio': { text: 'Uncolored' } } }, ...mappings],
        'Gia Scio'
      )
    ).toBeUndefined();
    expect(getMappedColor(undefined, 'Gia Scio')).toBeUndefined();
  });

  it('matches numeric ranges and special values without applying replacement text', () => {
    expect(
      getMappedColor(
        [{ type: MappingType.RangeToText, options: { from: 10, to: 20, result: { color: 'orange' } } }],
        '15'
      )
    ).toBe('orange');
    expect(
      getMappedColor(
        [{ type: MappingType.SpecialValue, options: { match: SpecialValueMatch.Null, result: { color: 'grey' } } }],
        null
      )
    ).toBe('grey');
  });

  it('surfaces invalid regex patterns', () => {
    expect(() =>
      getMappedColor(
        [{ type: MappingType.RegexToText, options: { pattern: '[', result: { color: 'red' } } }],
        'Gia Scio'
      )
    ).toThrow();
  });
});
