import type { CoursePeriod, PeriodCreatePayload } from 'src/types/services/curriculum';

export function missingStandardPeriods(existing: CoursePeriod[]): PeriodCreatePayload[] {
  const lastOrder = existing.reduce((max, period) => Math.max(max, Number(period.order) || 0), 0);
  let order = lastOrder;
  return [1, 2, 3, 4].flatMap((number) => {
    const name = `${number}º Bimestre`;
    const shortName = `B${number}`;
    const found = existing.filter(
      (period) =>
        period.shortName?.trim().toUpperCase() === shortName ||
        period.name.trim().toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR')
    );
    if (found.length > 1)
      throw new Error(
        `Há mais de um período correspondente a ${shortName}. Revise antes de criar o padrão.`
      );
    if (found.length) return [];
    order += 1;
    return [{ name, shortName, order, weight: 25 }];
  });
}
