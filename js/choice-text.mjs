// Round 12 (R12_Fixes): the ChoiceCard carries the question, so Pi's text before it never repeats it. The harness drops a
// line or sentence equal to the card's question (ignoring case, spaces, Markdown emphasis and the final punctuation).
const plain=text=>String(text||'').replace(/[*_`#>]/g,'').replace(/^\s*(?:[-+]\s+|\d+[.)]\s+)/,'').replace(/\s+/g,' ').trim().replace(/[?？.。:：!！]+$/,'').toLowerCase();

export function withoutQuestion(text,question){
 const wanted=plain(question);if(!wanted||!text)return text||'';
 const lines=String(text).split('\n').map(line=>{
  if(plain(line)===wanted)return null;
  const parts=line.split(/(?<=[?？.。!！])\s+/);const kept=parts.filter(part=>plain(part)!==wanted);
  return kept.length===parts.length?line:kept.join(' ');
 }).filter(line=>line!==null);
 return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
