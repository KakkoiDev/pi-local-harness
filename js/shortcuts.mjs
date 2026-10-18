// Round 12 shortcuts (R12_Refusals, "Changed earlier text"): one ⌃⌥ family the browser and macOS leave alone.
// Chat · Work · Activity · Gate ⌃⌥1–4, the phases ⌃⌥D · ⌃⌥P · ⌃⌥I, Preview ⌃⌥V, Run on Its Own ⌃⌥A, New File… ⌃⌥N,
// New Task… ⌃⌥T, Show Task Record ⌃⌥R. Menus show ⌃⌥. Installed as an app (its own window), the old ⌘ keys work too;
// in a browser tab they belong to the browser (⌘1–9 tabs, ⌘N ⌘T ⌘W windows and tabs), so the page leaves them alone.
// Keys are read by event.code, so the layout and Option's characters do not matter.
export const CONTROL_OPTION={Digit1:'view-chat',Digit2:'view-work',Digit3:'view-activity',Digit4:'view-gate',KeyV:'toggle-preview',KeyA:'run-on-own',KeyN:'new-file',KeyT:'new-task',KeyR:'task-record'};
export const PHASE_KEYS={KeyD:'discussion',KeyP:'planning',KeyI:'implementation'};
// The ⌘ shortcuts that moved to ⌃⌥ (or, for Close Window, to its close box only): kept only when installed as an app.
const MOVED=['Digit1','Digit2','Digit3','Digit4','alt+KeyP','alt+KeyA','shift+KeyN','KeyT','KeyW'];

export const installed=()=>Boolean(globalThis.matchMedia?.('(display-mode: standalone)').matches||globalThis.navigator?.standalone);

/** The ⌘ shortcut table for this window: the moved keys only when installed as an app. */
export function appShortcuts(table,app=installed()){return app?table:Object.fromEntries(Object.entries(table).filter(([key])=>!MOVED.includes(key)));}

export const controlOption=event=>event.ctrlKey&&event.altKey&&!event.metaKey&&!event.shiftKey;

/** ⌃⌥ keys run the same commands as the menus (enabled() decides, as for ⌘); ⌃⌥D/P/I choose the phase. */
export function installControlOption({run,enabled,update=()=>{},phase}){
 document.addEventListener('keydown',event=>{
  if(event.isComposing||!controlOption(event))return;
  const chosen=PHASE_KEYS[event.code],command=CONTROL_OPTION[event.code];
  if(chosen){event.preventDefault();event.stopImmediatePropagation();phase?.(chosen);return;}
  if(!command)return;update();event.preventDefault();event.stopImmediatePropagation();if(enabled(command))run(command);
 },true);
}
