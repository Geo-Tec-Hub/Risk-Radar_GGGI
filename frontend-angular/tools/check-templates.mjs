/**
 * Angular TEMPLATE type-check, standalone.
 *
 * WHY THIS EXISTS.  `tsc --noEmit` does not look inside component templates.
 * That gap has shipped two build breaks already:
 *
 *   - a component using `| date` without importing DatePipe (3 Sep);
 *   - two templates printing `s.period` after `period` was removed from
 *     ProfileScope (4 Sep).
 *
 * Both type-checked clean and both failed at `ng serve`. `ng build` catches
 * them, but it also needs a matching Node version and a full bundle; this runs
 * the compiler's own checker directly and reports in seconds.
 *
 *     npm run check:templates
 *
 * Run it before saying a frontend change compiles. "tsc passed" is not the
 * same claim.
 */
import { performCompilation, readConfiguration } from '@angular/compiler-cli';

const cfg = readConfiguration('tsconfig.app.json', { noEmit: true });
const { diagnostics } = performCompilation({
  rootNames: cfg.rootNames,
  options: { ...cfg.options, noEmit: true },
});

const errors = diagnostics.filter((d) => d.category === 1);
for (const d of errors.slice(0, 60)) {
  const file = d.file ? d.file.fileName : '(no file)';
  let pos = '';
  if (d.file && d.start != null) {
    const lc = d.file.getLineAndCharacterOfPosition(d.start);
    pos = `:${lc.line + 1}:${lc.character + 1}`;
  }
  const msg = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
  console.log(`ERROR ${file}${pos}  TS${d.code}: ${msg}`);
}
console.log(`\n${errors.length} template/type error(s)`);
process.exit(errors.length ? 1 : 0);
