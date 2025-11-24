import type { IGroupSortOption } from 'src/types/group';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

type Props = {
  sort: string;
  options: IGroupSortOption[];
  onChange: (value: string) => void;
};

export function GroupSort({ sort, options, onChange }: Props) {
  return (
    <TextField
      select
      size="small"
      value={sort}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 160 }}
    >
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
