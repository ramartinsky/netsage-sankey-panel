import React from 'react';
import { render } from '@testing-library/react';
import {
  applyFieldOverrides,
  createTheme,
  FieldConfigPropertyItem,
  FieldType,
  getDisplayProcessor,
  MappingType,
  Registry,
  toDataFrame,
  valueMappingsOverrideProcessor,
} from '@grafana/data';
import { parseData } from './dataParser';
import { Sankey } from './components/Sankey';

jest.mock('./components/Headers', () => ({ Headers: () => null }));
jest.mock('./components/Tooltip', () => ({ Tooltip: () => null }));

describe('mapped Sankey nodes', () => {
  const theme = createTheme();

  function parse(monochrome = false) {
    const frame = toDataFrame({
      fields: [
        {
          name: 'Source',
          type: FieldType.string,
          values: ['Gia Scio', 'Gia Scio', 'Unmapped'],
          config: {
            mappings: [
              {
                type: MappingType.RegexToText,
                options: { pattern: 'Gia.*', result: { color: 'green', text: 'Same' } },
              },
            ],
          },
        },
        {
          name: 'Destination',
          type: FieldType.string,
          values: ['Gia Scio', 'Gia Other', 'Unknown'],
          config: {
            mappings: [
              { type: MappingType.RegexToText, options: { pattern: 'Gia.*', result: { color: 'red', text: 'Same' } } },
            ],
          },
        },
        { name: 'Value', type: FieldType.number, values: [10, 20, 30] },
      ],
    });
    frame.fields.forEach((field) => {
      field.display = getDisplayProcessor({ field, theme });
    });
    return parseData(
      { series: [frame] },
      { valueField: 'Value' },
      monochrome,
      '#123456',
      theme.visualization.getColorByName
    );
  }

  it('uses each originating field configuration without renaming or merging nodes', () => {
    const [graph] = parse();
    expect(graph.nodes).toEqual([
      expect.objectContaining({ name: 'Gia Scio', colId: 0, color: theme.visualization.getColorByName('green') }),
      expect.objectContaining({ name: 'Gia Scio', colId: 1, color: theme.visualization.getColorByName('red') }),
      expect.objectContaining({ name: 'Gia Other', colId: 1, color: theme.visualization.getColorByName('red') }),
      expect.objectContaining({ name: 'Unmapped', color: undefined }),
      expect.objectContaining({ name: 'Unknown', color: undefined }),
    ]);
    expect(graph.links.map((link: { color: string }) => link.color)).toEqual(['#018EDB', '#018EDB', '#DB8500']);
    expect(parse(true)[0].links.map((link: { color: string }) => link.color)).toEqual([
      '#123456',
      '#123456',
      '#123456',
    ]);
  });

  it('consumes Grafana defaults and field-name regex overrides', () => {
    const data = applyFieldOverrides({
      data: [
        toDataFrame({
          fields: [
            { name: 'Source', type: FieldType.string, values: ['Gia Scio'] },
            { name: 'Destination', type: FieldType.string, values: ['Gia Scio'] },
            { name: 'Value', type: FieldType.number, values: [10] },
          ],
        }),
      ],
      fieldConfig: {
        defaults: {
          mappings: [{ type: MappingType.RegexToText, options: { pattern: 'Gia.*', result: { color: 'green' } } }],
        },
        overrides: [
          {
            matcher: { id: 'byRegexp', options: '^Destination$' },
            properties: [
              {
                id: 'mappings',
                value: [{ type: MappingType.ValueToText, options: { 'Gia Scio': { color: 'red' } } }],
              },
            ],
          },
        ],
      },
      fieldConfigRegistry: new Registry<FieldConfigPropertyItem>(() => [
        {
          id: 'mappings',
          path: 'mappings',
          name: 'Value mappings',
          editor: () => null,
          override: () => null,
          process: valueMappingsOverrideProcessor,
          shouldApply: () => true,
        },
      ]),
      replaceVariables: (text) => text,
      theme,
    });
    const [graph] = parseData(
      { series: data },
      { valueField: 'Value' },
      false,
      'blue',
      theme.visualization.getColorByName
    );
    expect(graph.nodes).toEqual([
      expect.objectContaining({ name: 'Gia Scio', colId: 0, color: theme.visualization.getColorByName('green') }),
      expect.objectContaining({ name: 'Gia Scio', colId: 1, color: theme.visualization.getColorByName('red') }),
    ]);
  });

  it('renders mapped fills, global fallback, raw labels, and unchanged links after layout', () => {
    const [graph, displayNames, rowDisplayNames, field] = parse();
    const { container } = render(
      <Sankey
        data={graph}
        displayNames={displayNames}
        rowDisplayNames={rowDisplayNames}
        field={field}
        width={600}
        height={400}
        id={1}
        textColor="#ffffff"
        nodeColor="#888888"
        nodeWidth={30}
        nodePadding={20}
        labelSize={14}
        iteration={7}
      />
    );
    expect(Array.from(container.querySelectorAll('rect'), (node) => node.getAttribute('fill'))).toEqual([
      theme.visualization.getColorByName('green'),
      theme.visualization.getColorByName('red'),
      theme.visualization.getColorByName('red'),
      '#888888',
      '#888888',
    ]);
    expect(Array.from(container.querySelectorAll('text'), (node) => node.textContent)).toEqual([
      'Gia Scio',
      'Gia Scio',
      'Gia Other',
      'Unmapped',
      'Unknown',
    ]);
    expect(Array.from(container.querySelectorAll('path'), (link) => link.getAttribute('stroke'))).toEqual([
      '#018EDB',
      '#018EDB',
      '#DB8500',
    ]);
  });
});
