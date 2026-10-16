// Only the embedding Preview may send a small set of keys. The project's socket protocol stays Textual's own.
(()=>{
 const parentOrigin=(()=>{try{return new URL(document.referrer).origin;}catch{return '';}})();
 const Native=window.WebSocket;let socket=null,control=false;
 window.WebSocket=class extends Native{constructor(url,...args){const address=new URL(url,location.href);if(address.pathname==='/ws'){address.host=location.host;address.port=new URL(location.href).port;address.protocol=location.protocol==='https:'?'wss:':'ws:';const lang=new URL(location.href).searchParams.get('lang');if(['en','ja'].includes(lang))address.searchParams.set('lang',lang);}super(address.href,...args);if(address.host===location.host&&address.pathname==='/ws')socket=this;}
  send(data){super.send(data);try{const [kind,size]=JSON.parse(data);if(kind==='resize')window.parent.postMessage({type:'pi-terminal-size',...size},parentOrigin);}catch{}}
 };
 const send=value=>{if(socket?.readyState===Native.OPEN)socket.send(JSON.stringify(['stdin',value]));};
 const keys={Escape:'\x1b',Tab:'\t',ArrowUp:'\x1b[A',ArrowDown:'\x1b[B',ArrowLeft:'\x1b[D',ArrowRight:'\x1b[C',Enter:'\r',Interrupt:'\x03'};
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||!parentOrigin||event.origin!==parentOrigin)return;
  if(event.data?.type==='pi-terminal-key'&&keys[event.data.key]){send(keys[event.data.key]);document.querySelector('textarea')?.focus();}
  if(event.data?.type==='pi-terminal-control'){control=Boolean(event.data.value);document.querySelector('textarea')?.focus();}
 });
 window.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.code==='Period'){event.preventDefault();event.stopImmediatePropagation();send('\x03');return;}if(control&&/^[a-z]$/i.test(event.key)){event.preventDefault();event.stopImmediatePropagation();control=false;send(String.fromCharCode(event.key.toUpperCase().charCodeAt(0)-64));window.parent.postMessage({type:'pi-terminal-control',value:false},parentOrigin);}},true);
})();
