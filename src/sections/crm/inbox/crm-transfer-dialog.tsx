'use client';

import type { CrmAgent, CrmDepartment, CrmConversation } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CrmService } from 'src/services/crm';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  conversation: CrmConversation;
  departments: CrmDepartment[];
  agents: CrmAgent[];
  onDone: (conversation: CrmConversation) => void;
};

export function CrmTransferDialog({ open, onClose, conversation, departments, agents, onDone }: Props) {
  const [departmentId, setDepartmentId] = useState('');
  const [agentKey, setAgentKey] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDepartmentId(conversation.departmentId ?? '');
      setAgentKey('');
      setMessage('');
    }
  }, [open, conversation]);

  const availableAgents = agents.filter(
    (a) => !departmentId || a.role !== 'agente' || a.departments.some((d) => d.id === departmentId)
  );

  const submit = async () => {
    const agent = agents.find((a) => `${a.userType}:${a.userId}` === agentKey);
    if (!departmentId && !agent) {
      toast.error('Escolha o setor e/ou o atendente');
      return;
    }
    setSaving(true);
    try {
      const updated = await CrmService.transferConversation(conversation.id, {
        departmentId: departmentId || null,
        userId: agent?.userId ?? null,
        userType: agent?.userType ?? null,
        message: message.trim() || null,
      });
      toast.success('Conversa transferida');
      onDone(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao transferir');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Transferir conversa</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Setor" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <MenuItem value="">(manter / sem setor)</MenuItem>
            {departments
              .filter((d) => d.active)
              .map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            select
            label="Atendente"
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            helperText="Sem atendente, a conversa volta para a fila do setor."
          >
            <MenuItem value="">(fila do setor)</MenuItem>
            {availableAgents.map((a) => (
              <MenuItem key={`${a.userType}:${a.userId}`} value={`${a.userType}:${a.userId}`}>
                {a.name} {a.departments.length ? `— ${a.departments.map((d) => d.name).join(', ')}` : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Mensagem para o contato (opcional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          Transferir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
