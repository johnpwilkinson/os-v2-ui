// Verbatim / representative journal.jsonl lines, per docs/observability-data-inventory.md §2.

export const LEG_START_LINE = `{"label":"val:9.1","kind":"validate","phase":"start"}`;

export const LEG_COMPLETE_LINE = `{"label":"val:9.1","kind":"validate","ok":true,"tokens":956,"ms":12443}`;

export const LEG_FAILED_LINE = `{"label":"debug:3.2","kind":"debug","ok":false,"error":"pytest exit 1","ms":803}`;

export const BATTERY_START_LINE = `{"kind":"battery","label":"mech:build","start":true}`;

export const BATTERY_COMPLETE_LINE = `{"kind":"battery","label":"mech:build","ok":true,"exitCode":0,"ms":3037}`;

export const FX_RECEIPT_START_LINE = `{"label":"setup:single-run-live-view","phase":"start"}`;

export const FX_RECEIPT_COMPLETE_LINE = `{"label":"setup:single-run-live-view","ok":true,"ms":120}`;

export const PLAIN_LOG_LINE = `{"log":"GATE: GO (validate-impl)"}`;

export const EVT_GATE_LINE = `{"log":"EVT {\\"v\\":1,\\"type\\":\\"gate\\",\\"turbo\\":\\"validate-impl\\",\\"feature\\":\\"single-run-live-view\\"}"}`;

export const GARBAGE_LINE = `not json at all {{{`;

export const UNRECOGNIZED_SHAPE_LINE = `{"foo":"bar"}`;
