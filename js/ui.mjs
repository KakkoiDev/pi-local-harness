export { icon, hydrateIcons, stateGlyph } from '../design/icons.mjs';
export function readState(key,fallback=null){try{return JSON.parse(localStorage.getItem('plh.'+key))??fallback;}catch{return fallback;}}
export function writeState(key,value){try{if(value===null)localStorage.removeItem('plh.'+key);else localStorage.setItem('plh.'+key,JSON.stringify(value));return true;}catch{return false;}}
