import type { IGroupItem } from 'src/types/group';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
  groups: IGroupItem[];
};

export function GroupList({ groups }: Props) {
  return (
    <Stack spacing={2}>
      {groups.map((g) => {
        const raw = g as any;

        const desc = typeof raw.description === 'string' ? raw.description : '';
        const tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];
        const totalMembers = typeof raw.totalMembers === 'number' ? raw.totalMembers : 0;
        const visibility =
          raw.visibility === 'public' || raw.visibility === 'private' ? raw.visibility : 'private';

        return (
          <Card key={g.id} sx={{ p: 2 }}>
            <Typography variant="h6">{g.name}</Typography>

            {desc ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {desc}
              </Typography>
            ) : null}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tags.map((t) => (
                <Typography
                  variant="caption"
                  key={t}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                  }}
                >
                  {t}
                </Typography>
              ))}
            </Stack>

            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              {totalMembers} membros • {visibility === 'public' ? 'Público' : 'Privado'}
            </Typography>
          </Card>
        );
      })}
    </Stack>
  );
}
