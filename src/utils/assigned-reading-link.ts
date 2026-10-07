type ReadingAssignment = { classId: string; isAssignedReading?: boolean };

/** Assigned readings open beside their class discussion; other texts keep the reader. */
export function assignedReadingLink(textId: string, assignments: ReadingAssignment[]): string {
  const reading = assignments.find(assignment => assignment.isAssignedReading === true);
  return reading
    ? `/discussions/texts/${encodeURIComponent(textId)}/${encodeURIComponent(reading.classId)}`
    : `/texts/${encodeURIComponent(textId)}`;
}
