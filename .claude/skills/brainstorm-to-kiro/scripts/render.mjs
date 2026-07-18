#!/usr/bin/env node
// render.mjs <slug> [<client-repo-root>] — Wave E structured authoring.
// The session LLM authors JSON CONTENT (hot-context; no dispatch layer);
// this CLI validates it against the _kiro-core schemas, renders the artifacts
// through the deterministic serializers, and parse-back-verifies each render
// against the REAL downstream parsers before writing a byte. Any refusal
// prints the full defect list and exits 1 — fix the JSON, never the render.
// Inputs (ephemeral, under the gitignored .kiro/.turbo/):
//   .kiro/.turbo/authoring/<slug>/tasks.json         TASKS_CONTENT_SCHEMA
//   .kiro/.turbo/authoring/<slug>/requirements.json  REQUIREMENTS_CONTENT_SCHEMA
//   .kiro/.turbo/authoring/<slug>/boundaries.json    BOUNDARIES_CONTENT_SCHEMA
// Outputs: .kiro/specs/<slug>/tasks.md, requirements.md; design.md's
// "## Boundary Commitments" section replaced in place (authored prose kept).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [slug, rootArg] = process.argv.slice(2);
if (!slug || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(slug)) {
  console.error('usage: render.mjs <slug> [<client-repo-root>] — slug must match ^[a-z0-9][a-z0-9._-]{0,63}$');
  process.exit(2);
}
const ROOT = rootArg ?? '.';
const OS_V2_ROOT = process.env.OS_V2_ROOT ?? join(process.env.HOME, 'lab', 'agents');
const SKILLS = join(OS_V2_ROOT, 'os-v2', 'plugins', 'os-core', 'skills');
const CORE = join(SKILLS, '_kiro-core');
if (!existsSync(join(CORE, 'spec-schemas.js'))) {
  console.error(`render: ${CORE} not found — set OS_V2_ROOT to the agents-repo clone`);
  process.exit(2);
}
const imp = (p) => import(pathToFileURL(p).href);
const { TASKS_CONTENT_SCHEMA, REQUIREMENTS_CONTENT_SCHEMA, BOUNDARIES_CONTENT_SCHEMA } = await imp(join(CORE, 'spec-schemas.js'));
const { validateAgainstSchema } = await imp(join(CORE, 'validate-schema.js'));
const { serializeTasks, expectedTasksParse } = await imp(join(CORE, 'serialize-tasks.js'));
const { serializeRequirements, expectedRequirementsParse } = await imp(join(CORE, 'serialize-requirements.js'));
const { serializeBoundaries, expectedFromTo } = await imp(join(CORE, 'serialize-boundaries.js'));
const { parseTasks } = await imp(join(SKILLS, 'kiro-impl-turbo', 'src', 'core-tasks.js'));
const { parseRequirements } = await imp(join(SKILLS, 'kiro-validate-impl-turbo', 'src', 'core-requirements.js'));
const { parseBoundaries } = await imp(join(SKILLS, 'kiro-design-to-rules-turbo', 'src', 'contract.js'));

const AUTH = join(ROOT, '.kiro', '.turbo', 'authoring', slug);
const SPEC = join(ROOT, '.kiro', 'specs', slug);
const defects = [];
const readJson = (name, required) => {
  const p = join(AUTH, name);
  if (!existsSync(p)) { if (required) defects.push(`${name}: missing (author it at ${p})`); return null; }
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { defects.push(`${name}: invalid JSON — ${e.message}`); return null; }
};
const tasksC = readJson('tasks.json', true);
const reqsC = readJson('requirements.json', true);
const bndC = readJson('boundaries.json', false);   // optional: a feature may have no boundary rows
if (tasksC) validateAgainstSchema(tasksC, TASKS_CONTENT_SCHEMA).forEach((e) => defects.push(`tasks.json ${e}`));
if (reqsC) validateAgainstSchema(reqsC, REQUIREMENTS_CONTENT_SCHEMA).forEach((e) => defects.push(`requirements.json ${e}`));
if (bndC) validateAgainstSchema(bndC, BOUNDARIES_CONTENT_SCHEMA).forEach((e) => defects.push(`boundaries.json ${e}`));
if (defects.length) { defects.forEach((d) => console.error(`RENDER RED: ${d}`)); process.exit(1); }

// Cross-artifact teeth: every task requirement id must exist in requirements.json.
const reqIds = new Set(expectedRequirementsParse(reqsC).map((r) => r.id));
for (const t of expectedTasksParse(tasksC)) {
  for (const r of t.requirements) if (!reqIds.has(r)) defects.push(`tasks.json: task ${t.id} references unknown requirement id ${r}`);
}
if (defects.length) { defects.forEach((d) => console.error(`RENDER RED: ${d}`)); process.exit(1); }

// The spec dir is the write target for BOTH paths (design.md edit + tasks/
// requirements writes). Guard it here so a missing dir teaches a loud refusal
// instead of leaking an uncaught ENOENT stack from the first writeFileSync.
if (!existsSync(SPEC)) { console.error(`RENDER RED: ${SPEC} missing — create .kiro/specs/<slug>/ (SKILL.md §1) before rendering`); process.exit(1); }

let tasksMd, reqsMd, bndSection = null;
try {
  tasksMd = serializeTasks(tasksC);
  if (JSON.stringify(parseTasks(tasksMd)) !== JSON.stringify(expectedTasksParse(tasksC))) throw new Error('tasks render→parse round-trip mismatch');
  reqsMd = serializeRequirements(reqsC);
  if (JSON.stringify(parseRequirements(reqsMd)) !== JSON.stringify(expectedRequirementsParse(reqsC))) throw new Error('requirements render→parse round-trip mismatch');
  if (bndC && bndC.boundaries.length) {
    bndSection = serializeBoundaries(bndC);
    const rows = parseBoundaries(bndSection, slug);
    if (rows.length !== bndC.boundaries.length) throw new Error(`boundaries: ${bndC.boundaries.length} authored, ${rows.length} parsed back`);
    rows.forEach((row, i) => {
      const want = expectedFromTo(bndC.boundaries[i]);
      if (!row.from || !row.to || row.from !== want.from || row.to !== want.to) {
        throw new Error(`boundaries row "${row.name}": derived {${row.from}, ${row.to}} != expected {${want.from}, ${want.to}}`);
      }
    });
  }
} catch (e) { console.error(`RENDER RED: ${e.message}`); process.exit(1); }

// design.md: replace the Boundary Commitments section in place (prose kept).
const designPath = join(SPEC, 'design.md');
if (bndSection) {
  if (!existsSync(designPath)) { console.error(`RENDER RED: ${designPath} missing — author the design prose first (with a "## Boundary Commitments" heading)`); process.exit(1); }
  const lines = readFileSync(designPath, 'utf8').split('\n');
  const start = lines.findIndex((l) => /^#{1,6}\s+.*Boundary Commitments/i.test(l));
  if (start < 0) { console.error('RENDER RED: design.md has no "## Boundary Commitments" heading — add one (empty section is fine) so the render owns exactly that section'); process.exit(1); }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (/^#{1,6}\s+/.test(lines[i])) { end = i; break; }
  const next = [...lines.slice(0, start), ...bndSection.split('\n'), '', ...lines.slice(end)];
  writeFileSync(designPath, next.join('\n'));
  console.error(`rendered: design.md Boundary Commitments (${bndC.boundaries.length} row(s))`);
}
writeFileSync(join(SPEC, 'tasks.md'), tasksMd);
console.error('rendered: tasks.md');
writeFileSync(join(SPEC, 'requirements.md'), reqsMd);
console.error('rendered: requirements.md');
console.error(`RENDER GREEN: .kiro/specs/${slug} — now run the check scripts + dry_run.sh as before`);
