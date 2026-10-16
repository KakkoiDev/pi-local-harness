// Kabelsalat publishes a browser ESM entry under "module"; Node follows its
// CommonJS "main", which has no named exports. Select its published ESM build.
export async function resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === '@kabelsalat/web' ? '@kabelsalat/web/dist/index.mjs' : specifier, context);
}
