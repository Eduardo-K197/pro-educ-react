import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

// ----------------------------------------------------------------------

type Props = {
  percent: number;
  completed: number;
  total: number;
  /** Aulas obrigatórias: a % e o certificado contam só elas. */
  required?: number;
  completedRequired?: number;
  dense?: boolean;
};

export function StudentProgressBar({ percent, completed, total, required, completedRequired, dense }: Props) {
  return (
    <Stack spacing={0.5}>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={percent === 100 ? 'success' : 'primary'}
        sx={{ height: dense ? 6 : 10, borderRadius: 1 }}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {required
          ? `${completedRequired ?? 0} de ${required} aulas obrigatórias · ${percent}%`
          : `${completed} de ${total} aulas concluídas · ${percent}%`}
      </Typography>
    </Stack>
  );
}
