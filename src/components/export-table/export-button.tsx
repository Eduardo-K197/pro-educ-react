'use client';

import type { ExportFilters, ExportResource } from 'src/services/export';

import { useState } from 'react';

import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

import { ExportDialog } from './export-dialog';

export function ExportButton({
  resource,
  initialFilters,
  disabled = false,
}: {
  resource: ExportResource;
  initialFilters?: ExportFilters;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="soft"
        color="inherit"
        startIcon={<Iconify icon="solar:export-bold" />}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Exportar Excel
      </Button>
      {open && (
        <ExportDialog
          resource={resource}
          initialFilters={initialFilters}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
