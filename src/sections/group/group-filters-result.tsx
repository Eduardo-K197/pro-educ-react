import type { IGroupUiFilters } from 'src/types/group';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
  filters: any;
  totalResults: number;
};

export function GroupFiltersResult({ filters, totalResults }: Props) {
  const chips: string[] = [];

  const raw = filters as Record<string, unknown>;

  const tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];
  const locations = Array.isArray(raw.locations) ? (raw.locations as string[]) : [];
  const visibility = typeof raw.visibility === 'string' ? (raw.visibility as string) : 'all';
  const minMembers = typeof raw.minMembers === 'number' ? (raw.minMembers as number) : 0;

  if (tags.length) chips.push(...tags.map((t: string) => `tag:${t}`));
  if (locations.length) chips.push(...locations.map((l: string) => `loc:${l}`));
  if (visibility !== 'all') chips.push(`vis:${visibility}`);
  if (minMembers) chips.push(`>=${minMembers} membros`);

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">
        {totalResults} resultado{totalResults !== 1 && 's'}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {chips.map((c: string) => (
          <Chip size="small" key={c} label={c} />
        ))}
      </Stack>
    </Stack>
  );
}
