import type { IGroupFilters } from 'src/types/group';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

type Props = {
  filters: IGroupFilters;
  totalResults: number;
};

export function GroupFiltersResult({ filters, totalResults }: Props) {
  const chips: string[] = [];

  if (filters.tags.length) chips.push(...filters.tags.map((t) => `tag:${t}`));
  if (filters.locations.length) chips.push(...filters.locations.map((l) => `loc:${l}`));
  if (filters.visibility !== 'all') chips.push(`vis:${filters.visibility}`);
  if (filters.minMembers) chips.push(`>=${filters.minMembers} membros`);

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">
        {totalResults} resultado{totalResults !== 1 && 's'}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {chips.map((c) => (
          <Chip size="small" key={c} label={c} />
        ))}
      </Stack>
    </Stack>
  );
}
