// Server admission is advisory; the queue checks capability again before starting tools.
export function projectWillQueue(state, project) {
 const agent=state?.agents?.[project];
 return agent ? !agent.available : Boolean(state?.jobs?.some(job=>job.status==='running'));
}
