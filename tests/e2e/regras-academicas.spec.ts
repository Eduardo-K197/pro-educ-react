import { test, expect } from '@playwright/test';
import { academicOverview, periodScore } from '../../src/utils/academic-report';
import { missingStandardPeriods } from '../../src/utils/standard-periods';
import { buildEntryPayload } from '../../src/utils/financial';

const grade = (value: number, weight = 1, periodId?: string) => ({ id: String(value), studentId: 1, subjectId: 'math', value, weight, periodId });

test('Cálculo distingue zero, ausência e pontos limitados pelo peso', () => {
  expect(periodScore([])).toBeNull();
  expect(periodScore([grade(0)])).toBe(0);
  expect(periodScore([grade(0), grade(10)])).toBe(5);
  expect(periodScore([grade(3, 4), grade(2, 6)])).toBe(5);
  expect(periodScore([grade(8, 4), grade(6, 6)])).toBe(10);
});

test('Sem período e peso de período ausente seguem a fórmula do PDF', () => {
  const report = academicOverview([{ id: 'math', name: 'Matemática' }, { id: 'art', name: 'Artes' }], [{ id: 'p1', courseId: 'course', name: 'B1', order: 1, weight: '3' }], [grade(0), grade(8, 1, 'p1')]);
  expect(report.columns[0].name).toBe('Sem período');
  expect(report.rows[0].average).toBe(6);
  expect(report.rows[1].average).toBeNull();
  expect(report.finalAverage).toBe(6);
});

test('Bimestres padrão não recriam períodos e rejeitam correspondência ambígua', () => {
  const complete = [1, 2, 3, 4].map((number) => ({ id: `p${number}`, courseId: 'course', schoolId: 'school-test', name: `${number}º Bimestre`, shortName: `B${number}`, order: number }));
  expect(missingStandardPeriods(complete)).toEqual([]);
  expect(missingStandardPeriods(complete.slice(0, 2)).map((period) => period.shortName)).toEqual(['B3', 'B4']);
  expect(() => missingStandardPeriods([complete[0], { ...complete[0], id: 'duplicate' }])).toThrow(/mais de um período/);
});

test('Parcelamento não arredonda centavos nem aceita desconto maior que a parcela', () => {
  const base = { value: 300, discount: 0, dueDate: '2026-12-10', billingType: 'BOLETO', categoryId: 'cat', studentId: 1, installmentCount: 3, amountMode: 'total' };
  expect(buildEntryPayload(base).installmentValue).toBe(100);
  expect(() => buildEntryPayload({ ...base, value: 100 })).toThrow(/dividido igualmente/);
  expect(() => buildEntryPayload({ ...base, value: 300.001 })).toThrow(/duas casas decimais/);
  expect(() => buildEntryPayload({ ...base, discount: 100 })).toThrow(/menor que o valor de cada parcela/);
});
