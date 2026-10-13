// Where you are lives in the path (task 106): /projects is the Projects home,
// /p/<project>/<view>[/<file inside the project>] is a project. Plain history.pushState, no framework.
const VIEWS = new Set(['chat', 'work', 'activity', 'gate']);

export function parseRoute(pathname, search = '') {
  const query = new URLSearchParams(search);
  if (query.get('document')) { const file = query.get('document'), project = file.split('/')[1]; return { level: 'project', project, view: 'work', file }; }
  if (query.get('chat')) return { chat: query.get('chat'), view: 'chat' };
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 1 && parts[0] === 'projects') return { level: 'projects' };
  if (parts[0] !== 'p' || !parts[1] || !VIEWS.has(parts[2])) return {};
  const route = { level: 'project', project: parts[1], view: parts[2] };
  if (parts[2] === 'work' && parts.length > 3) route.file = `projects/${parts[1]}/${parts.slice(3).join('/')}`;
  return route;
}

export function routePath({ level, project, view = 'chat', file }) {
  if (level === 'projects' || !project) return '/projects';
  const base = `/p/${encodeURIComponent(project)}/${VIEWS.has(view) ? view : 'chat'}`, prefix = `projects/${project}/`;
  if (view !== 'work' || !file?.startsWith(prefix)) return base;
  return base + '/' + file.slice(prefix.length).split('/').map(encodeURIComponent).join('/');
}
