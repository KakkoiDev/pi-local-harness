// Chat-only tolerance for model replies that print a JSON-escaped fence in a table cell.
// Decode one escape layer only when the fence's line breaks are themselves escaped.
export function fencedParts(text, firstOnly=false) {
  const parts=[];let cursor=0;
  for(const match of text.matchAll(/```([\w+-]*)[ \t]*(\r?\n|\\n)([\s\S]*?)\2```(?!`)/g)){
    if(match.index>cursor)parts.push({text:text.slice(cursor,match.index)});
    const body=match[2]==='\\n'&&!match[3].includes('\n')?match[3].replace(/\\([\\"nrt])/g,(_,escape)=>({'\\':'\\','"':'"',n:'\n',r:'\r',t:'\t'})[escape]):match[3];
    parts.push({code:true,text:body});cursor=match.index+match[0].length;if(firstOnly)break;
  }
  if(cursor<text.length)parts.push({text:text.slice(cursor)});
  return parts;
}
export const togglesFence=line=>/^```/.test(line)&&(line.match(/```/g)||[]).length%2===1;
