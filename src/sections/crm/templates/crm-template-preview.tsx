'use client';

import type { CrmWaTemplate } from 'src/types/services/crm-campaign';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Rótulo amigável da variável: "body.1" → "Corpo {{1}}". */
export function templateVariableLabel(key: string) {
  const [part, name] = key.split('.');
  const where = part === 'header' ? 'Cabeçalho' : part === 'body' ? 'Corpo' : part;
  return `${where} {{${name}}}`;
}

export function templateComponent(template: CrmWaTemplate, type: string) {
  return (template.components ?? []).find((c) => String(c.type).toUpperCase() === type);
}

/** Texto do template com as variáveis substituídas (para mostrar no histórico/preview). */
export function renderTemplateText(template: CrmWaTemplate, values: Record<string, string>) {
  const body = templateComponent(template, 'BODY')?.text ?? template.bodyText ?? '';
  return body.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_m, name) => values[`body.${name}`] || `{{${name}}}`);
}

function Highlighted({ text, part, values }: { text: string; part: string; values: Record<string, string> }) {
  const pieces = text.split(/(\{\{\s*[\w]+\s*\}\})/g);
  return (
    <>
      {pieces.map((piece, i) => {
        const match = /^\{\{\s*([\w]+)\s*\}\}$/.exec(piece);
        if (!match) return <span key={i}>{piece}</span>;
        const value = values[`${part}.${match[1]}`];
        return (
          <Box
            key={i}
            component="span"
            sx={{
              px: 0.5,
              borderRadius: 0.5,
              fontWeight: 600,
              bgcolor: value ? 'success.lighter' : 'warning.lighter',
              color: value ? 'success.darker' : 'warning.darker',
            }}
          >
            {value || piece}
          </Box>
        );
      })}
    </>
  );
}

type Props = {
  template: CrmWaTemplate;
  values?: Record<string, string>;
};

/** Balão estilo WhatsApp com header, corpo (variáveis destacadas), rodapé e botões. */
export function CrmTemplatePreview({ template, values = {} }: Props) {
  const header = templateComponent(template, 'HEADER');
  const body = templateComponent(template, 'BODY');
  const footer = templateComponent(template, 'FOOTER');
  const buttons = templateComponent(template, 'BUTTONS')?.buttons ?? [];
  const headerFormat = String(header?.format ?? 'TEXT').toUpperCase();

  return (
    <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#E5DDD5' }}>
      <Box sx={{ maxWidth: 360, bgcolor: '#fff', color: '#111', borderRadius: 1.5, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 1.25 }}>
          {header && headerFormat === 'TEXT' && header.text && (
            <Typography variant="subtitle2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>
              <Highlighted text={header.text} part="header" values={values} />
            </Typography>
          )}
          {header && headerFormat !== 'TEXT' && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: 96, mb: 1, borderRadius: 1, bgcolor: 'grey.200', color: 'grey.600' }}
            >
              <Iconify
                icon={headerFormat === 'IMAGE' ? 'solar:gallery-bold' : headerFormat === 'VIDEO' ? 'solar:videocamera-record-bold' : 'solar:document-bold'}
                width={32}
              />
              <Typography variant="caption">{headerFormat.toLowerCase()}</Typography>
            </Stack>
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <Highlighted text={body?.text ?? template.bodyText ?? ''} part="body" values={values} />
          </Typography>
          {footer?.text && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'grey.600' }}>
              {footer.text}
            </Typography>
          )}
        </Box>
        {buttons.length > 0 && (
          <>
            <Divider />
            {buttons.map((b, i) => (
              <Box key={i}>
                {i > 0 && <Divider />}
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75} sx={{ py: 1, color: '#00A5F4' }}>
                  <Iconify
                    width={16}
                    icon={b.type === 'URL' ? 'eva:external-link-fill' : b.type === 'PHONE_NUMBER' ? 'solar:phone-bold' : 'solar:reply-bold'}
                  />
                  <Typography variant="body2">{b.text}</Typography>
                </Stack>
              </Box>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
