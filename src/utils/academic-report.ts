import type { Grade, CoursePeriod } from 'src/services/grade';

// Same points model as StudentReportController, including default period weight 1.
export function periodScore(grades: Grade[]): number | null {
  const valid = grades.filter(
    (grade) =>
      grade.value != null &&
      String(grade.value).trim() !== '' &&
      Number.isFinite(Number(grade.value))
  );
  if (!valid.length) return null;
  const value = (grade: Grade) => Math.max(0, Math.min(10, Number(grade.value)));
  if (
    !valid.some(
      (grade) =>
        Number.isFinite(Number(grade.weight)) &&
        Number(grade.weight) > 0 &&
        Number(grade.weight) !== 1
    )
  ) {
    return valid.reduce((sum, grade) => sum + value(grade), 0) / valid.length;
  }
  const totals = valid.reduce(
    (acc, grade) => {
      const weight =
        Number.isFinite(Number(grade.weight)) && Number(grade.weight) > 0
          ? Number(grade.weight)
          : 1;
      return { points: acc.points + Math.min(value(grade), weight), max: acc.max + weight };
    },
    { points: 0, max: 0 }
  );
  return totals.max ? (totals.points / totals.max) * 10 : null;
}

export function academicOverview(
  subjects: { id: string; name: string }[],
  periods: CoursePeriod[],
  grades: Grade[]
) {
  const columns = [...periods].sort((a, b) => a.order - b.order);
  if (grades.some((grade) => !grade.periodId))
    columns.unshift({ id: '__none__', courseId: '', name: 'Sem período', order: -1, weight: '1' });
  const rows = subjects.map((subject) => {
    const cells = columns.map((period) => {
      const items = grades.filter(
        (grade) => grade.subjectId === subject.id && (grade.periodId || '__none__') === period.id
      );
      return { period, count: items.length, average: periodScore(items) };
    });
    const totals = cells.reduce(
      (acc, cell) => {
        const raw = Number(cell.period.weight ?? 1);
        const weight = Number.isFinite(raw) && raw > 0 ? raw : 1;
        return cell.average === null
          ? acc
          : { sum: acc.sum + cell.average * weight, weight: acc.weight + weight };
      },
      { sum: 0, weight: 0 }
    );
    return { subject, cells, average: totals.weight ? totals.sum / totals.weight : null };
  });
  const average = (items: (number | null)[]) => {
    const numbers = items.filter((item): item is number => item !== null);
    return numbers.length ? numbers.reduce((sum, item) => sum + item, 0) / numbers.length : null;
  };
  return {
    columns,
    rows,
    periodAverages: columns.map((_, index) => average(rows.map((row) => row.cells[index].average))),
    finalAverage: average(rows.map((row) => row.average)),
  };
}
