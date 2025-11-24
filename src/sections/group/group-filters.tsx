import type { IGroupFilters } from 'src/types/group';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

type Props = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  filters: IGroupFilters;
  setFilters: (patch: Partial<IGroupFilters>) => void;
  canReset: boolean;
  options: {
    tags: string[];
    locations: string[];
  };
};

export function GroupFilters({
                               open,
                               onOpen,
                               onClose,
                               filters,
                               setFilters,
                               canReset,
                               options,
                             }: Props) {
  const toggleArrayValue = (field: keyof Pick<IGroupFilters, 'tags' | 'locations'>, value: string) => {
    const current = filters[field];
    setFilters({
      [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  return (
    <>
      <Button variant="outlined" onClick={onOpen}>
        Filtros
      </Button>

      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 300, p: 2 } }}>
        <Stack spacing={3}>
          <FormGroup>
            {options.tags.map((t) => (
              <FormControlLabel
                key={t}
                control={
                  <Checkbox
                    checked={filters.tags.includes(t)}
                    onChange={() => toggleArrayValue('tags', t)}
                  />
                }
                label={t}
              />
            ))}
          </FormGroup>

          <FormGroup>
            {options.locations.map((l) => (
              <FormControlLabel
                key={l}
                control={
                  <Checkbox
                    checked={filters.locations.includes(l)}
                    onChange={() => toggleArrayValue('locations', l)}
                  />
                }
                label={l}
              />
            ))}
          </FormGroup>

          <TextField
            label="Min. membros"
            type="number"
            value={filters.minMembers ?? ''}
            onChange={(e) =>
              setFilters({ minMembers: e.target.value ? Number(e.target.value) : null })
            }
          />

          <TextField
            select
            label="Visibilidade"
            value={filters.visibility}
            onChange={(e) => setFilters({ visibility: e.target.value as IGroupFilters['visibility'] })}
          >
            <option value="all">Todas</option>
            <option value="public">Público</option>
            <option value="private">Privado</option>
          </TextField>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={!canReset}
              onClick={() =>
                setFilters({
                  tags: [],
                  locations: [],
                  visibility: 'all',
                  minMembers: null,
                })
              }
            >
              Limpar
            </Button>
            <Button variant="contained" onClick={onClose}>
              Aplicar
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}
