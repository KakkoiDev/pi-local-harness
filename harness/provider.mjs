import { readFileSync } from 'node:fs';
export const pinned = JSON.parse(readFileSync(new URL('./model.json', import.meta.url), 'utf8'));
export function localModels(config = {}) {
 const models = config.models || [];
 // The model chosen in the web menu bar (task 147) arrives in PI_HARNESS_MODEL with its capabilities.
 const chosen = process.env.PI_HARNESS_MODEL;
 const ids = new Set([...models.map(model=>model.id), pinned.model, 'gemma4:31b-mlx', ...(chosen ? [chosen] : [])]);
 return { ...config, api: config.api || 'openai-completions', apiKey: config.apiKey || 'ollama', baseUrl: config.baseUrl || 'http://127.0.0.1:11434/v1',
  models: [...ids].map(id=>{
   const original = models.find(model=>model.id===id) || {};
   const known = id === chosen;
   return {name:id, reasoning:id.startsWith('gemma4') || id.startsWith('gpt-oss'), contextWindow:32768,maxTokens:8192,
    cost:{input:0,output:0,cacheRead:0,cacheWrite:0}, ...original, id,
    ...(known ? {reasoning:process.env.PI_HARNESS_MODEL_THINKING === '1'} : {}), // the menu's choice wins over models.json, as input does
    input:(known ? process.env.PI_HARNESS_MODEL_VISION === '1' : id.startsWith('gemma4'))?['text','image']:(original.input || ['text'])};
  })};
}
