'use client';

import type { Question, QuestionType, QuestionInput } from 'src/services/learning';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Editor } from 'src/components/editor';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: 'Múltipla escolha (uma correta)',
  multiple: 'Múltipla escolha (várias corretas)',
  true_false: 'Verdadeiro ou falso',
  short: 'Resposta curta',
  essay: 'Dissertativa',
};

type Option = { id?: string; text: string; correct: boolean };

type Props = {
  open: boolean;
  question?: Question | null;
  /** Depois de envios, só enunciado e explicação podem mudar. */
  structureLocked?: boolean;
  onClose: () => void;
  onSubmit: (input: QuestionInput) => Promise<void>;
};

const blankOptions = (): Option[] => [
  { text: '', correct: true },
  { text: '', correct: false },
  { text: '', correct: false },
  { text: '', correct: false },
];

export function LearningQuestionDialog({ open, question, structureLocked, onClose, onSubmit }: Props) {
  const [type, setType] = useState<QuestionType>('single');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<Option[]>(blankOptions());
  const [truth, setTruth] = useState<boolean>(true);
  const [accepted, setAccepted] = useState('');
  const [points, setPoints] = useState('1');
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = question;
    setType(q?.type ?? 'single');
    setPrompt(q?.prompt ?? '');
    const key = q?.answerKey;
    setOptions(
      q?.options?.length
        ? q.options.map((o) => ({ id: o.id, text: o.text, correct: Array.isArray(key) ? key.includes(o.id) : key === o.id }))
        : blankOptions()
    );
    setTruth(typeof key === 'boolean' ? key : true);
    setAccepted(q?.type === 'short' && Array.isArray(key) ? (key as string[]).join('\n') : '');
    setPoints(String(q?.points ?? 1));
    setExplanation(q?.explanation ?? '');
  }, [open, question]);

  const choice = type === 'single' || type === 'multiple';
  const filled = options.filter((o) => o.text.trim());

  const problem = (() => {
    if (!prompt.replace(/<[^>]*>/g, '').trim()) return 'Escreva o enunciado.';
    if (choice && filled.length < 2) return 'Informe ao menos 2 alternativas.';
    if (choice && !filled.some((o) => o.correct)) return 'Marque a alternativa correta.';
    if (!(Number(points) > 0)) return 'Pontuação inválida.';
    return null;
  })();

  const toggleCorrect = (index: number) =>
    setOptions((prev) => prev.map((o, i) => (type === 'single' ? { ...o, correct: i === index } : i === index ? { ...o, correct: !o.correct } : o)));

  const submit = async () => {
    const input: QuestionInput = { prompt, explanation: explanation.trim() || null };
    if (!structureLocked) {
      input.type = type;
      input.points = Number(points);
      if (choice) {
        input.options = filled.map((o) => ({ id: o.id, text: o.text.trim() }));
        const correctIdx = filled.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
        input.answerKey = type === 'single' ? correctIdx[0] : correctIdx;
      } else if (type === 'true_false') {
        input.answerKey = truth;
      } else if (type === 'short') {
        input.answerKey = accepted.split('\n').map((x) => x.trim()).filter(Boolean);
      }
    }
    setSaving(true);
    try {
      await onSubmit(input);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{question ? 'Editar questão' : 'Nova questão'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {structureLocked && (
            <Alert severity="info">Já há envios desta avaliação: só o enunciado e a explicação podem ser alterados.</Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Tipo"
              value={type}
              disabled={structureLocked}
              onChange={(e) => setType(e.target.value as QuestionType)}
              sx={{ minWidth: 280 }}
            >
              {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                <MenuItem key={t} value={t}>
                  {QUESTION_TYPE_LABEL[t]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Pontos"
              type="number"
              value={points}
              disabled={structureLocked}
              onChange={(e) => setPoints(e.target.value)}
              inputProps={{ min: 0.25, step: 0.25 }}
              sx={{ width: 120 }}
            />
          </Stack>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Enunciado
            </Typography>
            <Editor value={prompt} onChange={setPrompt} placeholder="Escreva a pergunta..." sx={{ maxHeight: 320 }} />
          </Box>

          {choice && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Alternativas ({type === 'single' ? 'marque a correta' : 'marque todas as corretas'})
              </Typography>
              {options.map((o, i) => (
                <Stack key={o.id ?? `new-${i}`} direction="row" spacing={1} alignItems="center">
                  {type === 'single' ? (
                    <Radio checked={o.correct} disabled={structureLocked} onChange={() => toggleCorrect(i)} />
                  ) : (
                    <Checkbox checked={o.correct} disabled={structureLocked} onChange={() => toggleCorrect(i)} />
                  )}
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                    value={o.text}
                    disabled={structureLocked}
                    onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  />
                  <IconButton
                    size="small"
                    disabled={structureLocked || options.length <= 2}
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Iconify icon="eva:close-fill" />
                  </IconButton>
                </Stack>
              ))}
              {!structureLocked && options.length < 10 && (
                <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => setOptions((prev) => [...prev, { text: '', correct: false }])}>
                  + Alternativa
                </Button>
              )}
            </Stack>
          )}

          {type === 'true_false' && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Resposta correta</Typography>
              <ToggleButtonGroup exclusive value={truth} disabled={structureLocked} onChange={(_, v) => v !== null && setTruth(v)}>
                <ToggleButton value>Verdadeiro</ToggleButton>
                <ToggleButton value={false}>Falso</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          )}

          {type === 'short' && (
            <TextField
              label="Respostas aceitas (uma por linha)"
              multiline
              minRows={3}
              value={accepted}
              disabled={structureLocked}
              onChange={(e) => setAccepted(e.target.value)}
              helperText="A correção ignora maiúsculas, acentos e espaços. Sem nenhuma resposta, a questão vai para correção manual."
            />
          )}

          {type === 'essay' && <Alert severity="info">Dissertativa: entra na fila de correção do professor depois do envio.</Alert>}

          <TextField
            label="Explicação / gabarito comentado (opcional)"
            multiline
            minRows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            helperText="Aparece para o aluno junto com o gabarito, quando você liberar os resultados."
          />
          {problem && <Alert severity="warning">{problem}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={saving} disabled={!!problem} onClick={submit}>
          Salvar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
