# Changelog

## 1.0.0

First release of Sankey Rainbow, forked from NetSage Sankey Panel 1.1.3.

- Color nodes using Grafana value mappings, including exact values and regex patterns, with per-field overrides.
- Preserve raw node labels and existing link colors; unmatched nodes retain the configured node color.
- Require Grafana 12.2+; rebuilt on the current Grafana plugin tooling (React 18, Grafana 12 SDK).
- Display parsing errors in the panel, including invalid mapping regex patterns.
