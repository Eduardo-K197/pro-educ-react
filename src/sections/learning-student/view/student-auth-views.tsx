'use client';

import type { TokenInfo, StudentProfile } from 'src/services/learning-student';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { setStudentToken, StudentLearningApi } from 'src/services/learning-student';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const errorOf = (err: any, fallback: string) => err?.message || fallback;

function AuthCard({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: { xs: 2, sm: 6 } }}>
      <Card sx={{ p: { xs: 3, sm: 4 }, width: 1, maxWidth: 440 }}>
        <Typography variant="h5" sx={{ mb: subtitle ? 1 : 3 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Card>
    </Box>
  );
}

type PasswordFieldProps = { label: string; value: string; onChange: (v: string) => void; autoComplete: string };

function PasswordField({ label, value, onChange, autoComplete }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShow((v) => !v)} edge="end" aria-label="Mostrar senha">
              <Iconify icon={show ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

function passwordProblem(password: string, confirm: string) {
  if (password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return 'A senha precisa ter letras e números.';
  if (password !== confirm) return 'As senhas não conferem.';
  return null;
}

// ---------------------------------------------------------------- login

export function StudentSignInView() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState<StudentProfile[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (profileId?: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await StudentLearningApi.login({ email: email.trim(), password, profileId });
      if ('needsProfile' in result) {
        setProfiles(result.profiles);
        return;
      }
      setStudentToken(result.token, result.expiresIn);
      router.replace(paths.student.root);
    } catch (err) {
      setError(errorOf(err, 'Não foi possível entrar.'));
    } finally {
      setLoading(false);
    }
  };

  if (profiles) {
    return (
      <AuthCard title="Quem vai estudar agora?" subtitle="Esta conta tem acesso a mais de um aluno.">
        <Stack spacing={1.5}>
          {profiles.map((p) => (
            <Button key={p.id} variant="outlined" size="large" disabled={loading} onClick={() => submit(p.id)} sx={{ justifyContent: 'flex-start' }}>
              <Stack alignItems="flex-start">
                <span>{p.studentName}</span>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {p.schoolName}
                </Typography>
              </Stack>
            </Button>
          ))}
          {error && <Alert severity="error">{error}</Alert>}
          <Button onClick={() => setProfiles(null)}>Voltar</Button>
        </Stack>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Entrar" subtitle="Use o e-mail e a senha cadastrados no convite da escola.">
      <Stack
        component="form"
        spacing={2.5}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" fullWidth />
        <PasswordField label="Senha" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <Alert severity="error">{error}</Alert>}
        <LoadingButton type="submit" variant="contained" size="large" loading={loading} disabled={!email.trim() || !password}>
          Entrar
        </LoadingButton>
        <Link component={RouterLink} href={paths.student.forgot} variant="body2" sx={{ alignSelf: 'center' }}>
          Esqueci a senha
        </Link>
      </Stack>
    </AuthCard>
  );
}

// ---------------------------------------------------------------- esqueci a senha

export function StudentForgotView() {
  return (
    <AuthCard title="Esqueci a senha">
      <Stack spacing={2}>
        <Typography variant="body2">
          Peça à secretaria da escola um <strong>link de redefinição de senha</strong>. Ele chega por mensagem, vale por 72 horas e
          pode ser usado uma única vez.
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Ao abrir o link, você escolhe a nova senha e volta a entrar normalmente.
        </Typography>
        <Button component={RouterLink} href={paths.student.signIn} variant="outlined">
          Voltar para o login
        </Button>
      </Stack>
    </AuthCard>
  );
}

// ---------------------------------------------------------------- convite / redefinição

function useTokenInfo(purpose: 'invite' | 'reset') {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Link inválido.');
      setLoading(false);
      return;
    }
    const inspect = purpose === 'invite' ? StudentLearningApi.inspectInvite : StudentLearningApi.inspectReset;
    inspect(token)
      .then(setInfo)
      .catch((err) => setError(errorOf(err, 'Link inválido.')))
      .finally(() => setLoading(false));
  }, [token, purpose]);

  return { token, info, error, loading };
}

function InvalidLink({ message }: { message: string }) {
  return (
    <AuthCard title="Link indisponível">
      <Stack spacing={2}>
        <Alert severity="warning">{message}</Alert>
        <Button component={RouterLink} href={paths.student.signIn} variant="outlined">
          Ir para o login
        </Button>
      </Stack>
    </AuthCard>
  );
}

const Loading = () => (
  <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
);

export function StudentInviteView() {
  const router = useRouter();
  const { token, info, error, loading } = useTokenInfo('invite');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <Loading />;
  if (error || !info) return <InvalidLink message={error || 'Link inválido.'} />;

  const existing = info.hasPassword;
  const problem = existing ? (password ? null : 'Informe sua senha.') : passwordProblem(password, confirm);

  const submit = async () => {
    setSubmitError('');
    setSaving(true);
    try {
      const session = await StudentLearningApi.acceptInvite(token, password);
      setStudentToken(session.token, session.expiresIn);
      router.replace(paths.student.root);
    } catch (err) {
      setSubmitError(errorOf(err, 'Não foi possível concluir.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthCard
      title={existing ? 'Confirmar acesso' : 'Criar sua senha'}
      subtitle={
        <>
          {info.schoolName ? `${info.schoolName} liberou` : 'A escola liberou'} o acesso{info.studentName ? ` de ${info.studentName}` : ''}. Login:{' '}
          <strong>{info.email}</strong>
          {existing ? '. Este e-mail já tem senha: confirme com a senha atual.' : ''}
        </>
      }
    >
      <Stack
        component="form"
        spacing={2.5}
        onSubmit={(e) => {
          e.preventDefault();
          if (!problem) submit();
        }}
      >
        <PasswordField label={existing ? 'Senha atual' : 'Nova senha'} value={password} onChange={setPassword} autoComplete={existing ? 'current-password' : 'new-password'} />
        {!existing && <PasswordField label="Confirme a senha" value={confirm} onChange={setConfirm} autoComplete="new-password" />}
        {!existing && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Mínimo de 8 caracteres, com letras e números.
          </Typography>
        )}
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <LoadingButton type="submit" variant="contained" size="large" loading={saving} disabled={!!problem}>
          {existing ? 'Confirmar e entrar' : 'Criar senha e entrar'}
        </LoadingButton>
      </Stack>
    </AuthCard>
  );
}

export function StudentResetView() {
  const { token, info, error, loading } = useTokenInfo('reset');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return <Loading />;
  if (error || !info) return <InvalidLink message={error || 'Link inválido.'} />;

  if (done) {
    return (
      <AuthCard title="Senha alterada">
        <Stack spacing={2}>
          <Alert severity="success">Pronto! Entre com a nova senha.</Alert>
          <Button component={RouterLink} href={paths.student.signIn} variant="contained">
            Entrar
          </Button>
        </Stack>
      </AuthCard>
    );
  }

  const problem = passwordProblem(password, confirm);

  const submit = async () => {
    setSubmitError('');
    setSaving(true);
    try {
      await StudentLearningApi.reset(token, password);
      setDone(true);
    } catch (err) {
      setSubmitError(errorOf(err, 'Não foi possível alterar a senha.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthCard title="Nova senha" subtitle={<>Login: <strong>{info.email}</strong></>}>
      <Stack
        component="form"
        spacing={2.5}
        onSubmit={(e) => {
          e.preventDefault();
          if (!problem) submit();
        }}
      >
        <PasswordField label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField label="Confirme a senha" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Mínimo de 8 caracteres, com letras e números.
        </Typography>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <LoadingButton type="submit" variant="contained" size="large" loading={saving} disabled={!!problem}>
          Salvar nova senha
        </LoadingButton>
      </Stack>
    </AuthCard>
  );
}
