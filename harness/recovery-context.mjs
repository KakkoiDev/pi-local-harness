/* Effective context only: never rewrite durable session history or invent a summary/approval. */
export function cleanRecoveryMessages(messages) {
  return messages.map(message=>{
    if(message.role!=='user')return message;
    const content=typeof message.content==='string'?[{type:'text',text:message.content}]:message.content;
    if(!Array.isArray(content))return message;
    let changed=false;
    const parts=content.map(part=>{
      if(part.type!=='text'||!/^Harness recovery: /.test(part.text||'')||!part.text.includes('\n\nReinjected AGENTS.md:\n'))return part;
      changed=true;
      return {...part,text:part.text.split('\n\nReinjected AGENTS.md:\n')[0].slice(0,1600)+'\n[Current operating instructions are supplied in the system prompt.]'};
    });
    return changed?{...message,content:parts}:message;
  });
}

export function recentHistory(messages, request, maxChars=6000) {
  const index=messages.lastIndexOf(request);
  if(index<=0)return messages;
  const kept=[];let chars=0;
  /* Keep complete recent human requests and the last prose answer. No orphan tool calls/results. */
  for(let at=index-1;at>=0;at--){
    const message=messages[at],text=typeof message.content==='string'?message.content:(message.content||[]).filter(part=>part.type==='text').map(part=>part.text||'').join('\n');
    const user=message.role==='user'&&!/^(?:Harness recovery: |Continue \(harness wake-up)/.test(text);
    const answer=message.role==='assistant'&&message.stopReason==='stop'&&!kept.some(item=>item.role==='assistant')&&(typeof message.content==='string'||(message.content||[]).every(part=>part.type==='text'||part.type==='thinking'));
    if(!user&&!answer)continue;
    const size=JSON.stringify(message).length;if(chars+size>maxChars)continue;
    kept.unshift(message);chars+=size;
  }
  return [...kept,...messages.slice(index)];
}

export function incompleteToolJSON(message) {
  return message?.role==='assistant'&&message.stopReason==='error'&&/error parsing tool call:[\s\S]*(?:unexpected end of JSON input|invalid character\b|invalid escape\b|invalid unicode\b)/i.test(String(message.errorMessage||''));
}
