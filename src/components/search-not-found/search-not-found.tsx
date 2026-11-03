import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type SearchNotFoundProps = BoxProps & {
  query?: string;
};

export function SearchNotFound({ query, sx, ...other }: SearchNotFoundProps) {
  if (!query) {
    return (
      <Typography variant="body2" sx={sx}>
        Digite para buscar
      </Typography>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', borderRadius: 1.5, ...sx }} {...other}>
      <Box sx={{ mb: 1, typography: 'h6' }}>Nada encontrado</Box>

      <Typography variant="body2">
        Nenhum resultado encontrado para &nbsp;
        <strong>{`"${query}"`}</strong>
        .
        <br /> Verifique se não há erros de digitação ou tente usar palavras completas.
      </Typography>
    </Box>
  );
}
