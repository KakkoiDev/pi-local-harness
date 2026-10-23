// Pi's bash tool appends this footer on nonzero exit. Other tool text is not an exit status.
export function toolExitCode(event) {
 if (!event.isError) return 0;
 if (event.toolName !== 'bash') return 1;
 const text=(event.content||[]).filter(part=>part.type==='text').map(part=>part.text||'').join('\n');
 const found=text.trimEnd().match(/(?:^|\n)Command exited with code ([1-9]\d{0,2})$/);
 const code=found?Number(found[1]):1;
 return code<=255?code:1;
}
