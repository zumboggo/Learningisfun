const classLabels = new Map([
  ['09d7f0a7-4c29-462c-820f-e11ea914d375', 'World Lit Red'],
  ['b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c', 'World Lit Blue'],
  ['e24ec8d9-21d7-4c32-a30e-08655c2f4e65', 'Ethics'],
  ['88421c66-9cda-4002-8e15-086312b7805e', 'AP Lang'],
]);

export function lessonClassLabel(classId: string, name: string): string {
  return classLabels.get(classId) ?? name;
}
