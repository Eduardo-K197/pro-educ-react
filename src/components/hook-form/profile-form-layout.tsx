import { ReactNode } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fData } from 'src/utils/format-number';
import { Label } from 'src/components/label';
import { Field } from 'src/components/hook-form';

type Props = {
    children: ReactNode;
    isEdit: boolean;
    isSubmitting: boolean;
    disableStatus?: boolean;
};

export function ProfileFormLayout ({ children, isEdit, isSubmitting, disableStatus}: Props) {
    const { watch, control } = useFormContext();

    const values = watch();

    return (
        <Grid container spacing={3}>

            {/* LADO ESQUERDO: Avatar e Status */}
            <Grid xs={12} md={4}>
                <Card sx={{ pt: 10, pb: 5, px: 3 }}>
                    {isEdit && values.status && (
                        <Label
                            color={
                            (values.status === 'active' && 'success') ||
                            (values.status === 'banned' && 'error') ||
                            'warning'
                            }
                            sx={{ position: 'absolute', top: 24, right: 24 }}
                        >
                            {values.status}
                        </Label>
                    )}

                <Box sx={{ mb: 5 }}>
                <Field.UploadAvatar
                    name="avatarUrl"
                    maxSize={3145728}
                    helperText={
                        <Typography variant="caption" sx={{ mt: 3, mx: 'auto', display: 'block', textAlign: 'center', color: 'text disabled' }}>
                            Allowed *.jpeg, *.jpg, *.png, *.gif
                            <br /> max size of {fData(3145728)}
                        </Typography>
                    }
                />
            </Box>

            {!disableStatus && isEdit && (
                <FormControlLabel
                labelPlacement="start"
                control={
                    <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                            field.onChange(event.target.checked ? 'banned' : 'active')
                        }
                        />
                    )}
                    />
                }
                label={
                    <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        Banned
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Apply disable account
                    </Typography>
                    </>
                }
                sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
                />
            )}
        </Card>
      </Grid>

        {/* LADO DIREITO: Dados + Senha */}
        <Grid xs={12} md={8}>
            <Card sx={{ p: 3 }}>
                <Box
                    rowGap={3}
                    columnGap={2}
                    display="grid"
                    gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
                >
                    {children}
                </Box>

                <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                        {!isEdit ? 'Create admin' : 'Save changes'}
                    </LoadingButton>
                </Stack>
            </Card>
        </Grid>
    </Grid>
    )
}