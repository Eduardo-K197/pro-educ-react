import type { IGroupItem } from 'src/types/group';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

type Props = {
  groups: IGroupItem[];
};

export function GroupList({ groups }: Props) {
  return (
    <Stack spacing={2}>
      {groups.map((g) => (
        <Card key={g.id} sx={{ p: 2 }}>
          <Typography variant="h6">{g.name}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {g.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {g.tags.map((t) => (
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
            {g.totalMembers} membros • {g.visibility === 'public' ? 'Público' : 'Privado'}
          </Typography>
        </Card>
      ))}
    </Stack>
  );
}
