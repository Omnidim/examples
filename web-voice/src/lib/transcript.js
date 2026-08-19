export function applyTranscriptSnapshot(current, line, createId) {
  const lastIndex = current.length - 1;
  const previous = current[lastIndex];
  const replacesOpenTurn = previous?.role === line.role && previous.final === false;

  if (!replacesOpenTurn) {
    return [...current, { id: createId(line.role), ...line }];
  }

  const updated = [...current];
  updated[lastIndex] = { id: previous.id, ...line };
  return updated;
}
