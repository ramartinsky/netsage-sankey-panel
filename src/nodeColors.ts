import { MappingType, SpecialValueMatch, stringToJsRegex, ValueMapping } from '@grafana/data';

// Inspect mappings directly: display processors also return colors for unmapped values.
export function getMappedColor(mappings: ValueMapping[] = [], value: unknown): string | undefined {
  for (const mapping of mappings) {
    switch (mapping.type) {
      case MappingType.ValueToText: {
        if (value != null && Object.prototype.hasOwnProperty.call(mapping.options, String(value))) {
          return mapping.options[String(value)].color || undefined;
        }
        break;
      }
      case MappingType.RangeToText: {
        if (value == null) {
          break;
        }
        const numericValue = parseFloat(String(value));
        if (
          !Number.isNaN(numericValue) &&
          !(numericValue < Number(mapping.options.from)) &&
          !(numericValue > Number(mapping.options.to))
        ) {
          return mapping.options.result.color || undefined;
        }
        break;
      }
      case MappingType.RegexToText:
        if (typeof value === 'string' && stringToJsRegex(mapping.options.pattern).test(value)) {
          return mapping.options.result.color || undefined;
        }
        break;
      case MappingType.SpecialValue: {
        const match = mapping.options.match;
        if (
          (match === SpecialValueMatch.Null && value == null) ||
          (match === SpecialValueMatch.NaN && Number.isNaN(Number(value))) ||
          (match === SpecialValueMatch.NullAndNaN && (value == null || Number.isNaN(Number(value)))) ||
          (match === SpecialValueMatch.True && (value === true || value === 'true')) ||
          (match === SpecialValueMatch.False && (value === false || value === 'false')) ||
          (match === SpecialValueMatch.Empty && value === '')
        ) {
          return mapping.options.result.color || undefined;
        }
        break;
      }
    }
  }
  return undefined;
}
