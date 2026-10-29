// Per-field version stamps allow independent device snapshots to converge without
// a shared last-writer-wins document overwriting edits made on another device.
function planningFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (['cards', 'cardDone', 'rows'].includes(key)) value.forEach((item, i) => { fields[key + '.' + i] = item; });
    else if (!['notes', 'todoChecked'].includes(key)) fields[key] = value;
  }
  fields.todo = { notes: data.notes, checked: data.todoChecked };
  return fields;
}
function planningSet(data, key, value) {
  if (key === 'todo') { data.notes = value.notes; data.todoChecked = value.checked; }
  else if (/^(cards|cardDone|rows)\.\d+$/.test(key)) { const [name, i] = key.split('.'); data[name][Number(i)] = value; }
  else data[key] = value;
}
function planningMerge(target, source) {
  target.deleted ||= {};
  for (const [id, stamp] of Object.entries(source.deleted || {})) {
    if (stamp > (target.deleted[id] || '')) target.deleted[id] = stamp;
  }
  for (const incoming of source.boards) {
    if (target.deleted[incoming.id]) continue;
    let board = target.boards.find(b => b.id === incoming.id);
    if (!board) { target.boards.push(JSON.parse(JSON.stringify(incoming))); continue; }
    board.versions ||= {};
    const fields = planningFields(incoming.data), own = planningFields(board.data);
    for (const [key, value] of Object.entries(fields)) {
      const theirs = incoming.versions?.[key] || '', ours = board.versions[key] || '';
      // Deterministic baseline for legacy snapshots lacking field versions.
      if (theirs > ours || (theirs === ours && JSON.stringify(value) > JSON.stringify(own[key]))) {
        planningSet(board.data, key, value); board.versions[key] = theirs;
      }
    }
  }
  target.boards = target.boards.filter(b => !target.deleted[b.id]);
  return target;
}
