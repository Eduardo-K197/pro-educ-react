'use client';

import type { CrmMessage } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { CrmService } from 'src/services/crm';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const cache = new Map<string, { url: string; exp: number }>();

/** URL assinada (curta) para uma mídia privada do CRM, com cache em memória. */
export function useSignedMediaUrl(key?: string | null) {
  const [url, setUrl] = useState<string | null>(() => {
    const hit = key ? cache.get(key) : undefined;
    return hit && hit.exp > Date.now() ? hit.url : null;
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!key) return undefined;
    const hit = cache.get(key);
    if (hit && hit.exp > Date.now()) {
      setUrl(hit.url);
      return undefined;
    }
    let cancelled = false;
    CrmService.mediaUrl(key)
      .then((res) => {
        cache.set(key, { url: res.url, exp: new Date(res.expiresAt).getTime() - 60_000 });
        if (!cancelled) setUrl(res.url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { url, error };
}

type Props = {
  message: CrmMessage;
  onOpenImage?: (url: string) => void;
};

export function CrmMedia({ message, onOpenImage }: Props) {
  const {media} = message;
  const { url, error } = useSignedMediaUrl(media?.key);

  if (!media) return null;

  if (!media.key) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        {message.error || 'Mídia indisponível'}
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography variant="caption" sx={{ color: 'error.main' }}>
        Não foi possível carregar a mídia
      </Typography>
    );
  }

  if (!url) return <CircularProgress size={20} sx={{ m: 1 }} />;

  if (message.type === 'image' || message.type === 'sticker') {
    return (
      <Box
        component="img"
        alt={media.fileName || 'imagem'}
        src={url}
        onClick={() => onOpenImage?.(url)}
        sx={{
          maxWidth: message.type === 'sticker' ? 140 : 280,
          maxHeight: 320,
          borderRadius: 1,
          cursor: 'zoom-in',
          display: 'block',
          objectFit: 'cover',
        }}
      />
    );
  }

  if (message.type === 'audio') {
    return <Box component="audio" controls src={url} sx={{ width: 260, maxWidth: 1 }} />;
  }

  if (message.type === 'video') {
    return <Box component="video" controls src={url} sx={{ width: 280, maxWidth: 1, borderRadius: 1 }} />;
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Iconify icon="solar:document-bold-duotone" width={28} />
      <Link href={url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ wordBreak: 'break-all' }}>
        {media.fileName || 'Abrir documento'}
      </Link>
    </Stack>
  );
}
