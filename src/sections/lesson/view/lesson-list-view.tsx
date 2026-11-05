'use client';

import type { LessonListItem } from 'src/types/services/lesson';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useListQuery } from 'src/hooks/use-list-query';
import { ClassroomService } from 'src/services/classroom';
import { TeacherService } from 'src/services/teacher';
import { useBoolean } from 'src/hooks/use-boolean';

import { LessonService } from 'src/services/lesson';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomTable } from 'src/components/list-table/list-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ExportButton } from 'src/components/export-table/export-button';

import { LessonTableRow } from '../lesson-table-row';

const TABLE_HEAD = [
  { id: 'name', label: 'Aula / Descrição' },
  { id: 'classroom', label: 'Turma', width: 160 },
  { id: 'teacher', label: 'Professor', width: 160 },
  { id: 'date', label: 'Data', width: 110 },
  { id: 'time', label: 'Horário', width: 120 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 60 },
];

export function LessonListView() {
  const table = useTable({ defaultOrderBy: 'date', defaultRowsPerPage: 10 });
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<LessonListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const {params:query,write}=useListQuery(table.onResetPage);
  const search=query.get('search')??'';
  const [draft,setDraft]=useState(search);
  const classroomId=query.get('classroomId')??'', teacherId=query.get('teacherId')??'',status=query.get('status')??'',dateFrom=query.get('dateFrom')??'',dateTo=query.get('dateTo')??'';
  const invalidDates=!!dateFrom&&!!dateTo&&dateFrom>dateTo;
  const [loadError,setLoadError]=useState(false);
  const [classrooms,setClassrooms]=useState<{id:string;name:string}[]>([]);
  const [teachers,setTeachers]=useState<{id:string;name:string}[]>([]);
  useEffect(()=>{setDraft(search);},[search]);
  useEffect(()=>{const controller=new AbortController();ClassroomService.list({hasPagination:false},{signal:controller.signal}).then(data=>setClassrooms(data.classrooms??[])).catch(()=>{});TeacherService.list({hasPagination:false},{signal:controller.signal}).then(data=>setTeachers(data.teachers??[])).catch(()=>{});return()=>controller.abort();},[]);


  useEffect(() => {
    let cancelled = false;
    setLoading(true);setLoadError(false);
    if(invalidDates){setLoading(false);setTableData([]);setTotal(0);return undefined;}

    const params: Record<string, any> = {
      page: table.page + 1,
      perPage: table.rowsPerPage,
    };
    if (search) params.search = search;
    Object.entries({classroomId,teacherId,status,dateFrom,dateTo}).forEach(([key,value])=>{if(value)params[key]=value;});

    LessonService.list(params)
      .then((res) => {
        if (cancelled) return;
        setTableData((res as any).classes ?? []);
        setTotal((res as any).count ?? 0);
      })
      .catch(() => { if (!cancelled) {setLoadError(true);setTableData([]);setTotal(0);} })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [table.page, table.rowsPerPage, search, refreshKey,classroomId,teacherId,status,dateFrom,dateTo,invalidDates]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await LessonService.delete(id);
        toast.success('Aula excluída');
        reload();
      } catch {
        toast.error('Erro ao excluir aula');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => LessonService.delete(id)));
      toast.success('Aulas excluídas');
      table.onSelectAllRows(false, []);
      reload();
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [table, reload]);

  const notFound = !loading && !loadError && !invalidDates && tableData.length === 0;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Aulas"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Aulas', href: paths.dashboard.lessons.root },
          { name: 'Listagem' },
        ]}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <ExportButton resource="lessons" initialFilters={{search,status:status||'all',classroomId:classroomId||undefined,teacherId:teacherId||undefined,dateField:'date',from:dateFrom||undefined,to:dateTo||undefined}} disabled={loading} />
            <Button component={RouterLink} href={paths.dashboard.lessons.new} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
            Nova aula
          </Button>
          </Stack>
        }

        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loadError&&<Alert severity="error" action={<Button onClick={reload}>Tentar novamente</Button>} sx={{mb:2}}>Não foi possível consultar as aulas. Isso não significa que não existam aulas cadastradas.</Alert>}
      {invalidDates&&<Alert severity="warning" sx={{mb:2}}>A data inicial deve ser anterior ou igual à data final.</Alert>}
      <CustomTable
        table={table}
        dataFiltered={tableData}
        tableHead={TABLE_HEAD}
        notFound={notFound}
        loading={loading}
        totalCount={total}
        onDeleteRows={confirm.onTrue}
        filters={
          <Box component="form" onSubmit={event=>{event.preventDefault();write({search:draft.trim()});}} sx={{p:2.5}}>
            <Box display="grid" gridTemplateColumns={{xs:'1fr',sm:'1fr 1fr',lg:'2fr 1fr 1fr'}} gap={2}>
              <TextField size="small" label="Buscar aula" placeholder="Descrição, turma ou professor" value={draft} onChange={event=>setDraft(event.target.value)}/>
              <TextField select size="small" label="Turma" value={classroomId} onChange={event=>write({classroomId:event.target.value})}><MenuItem value="">Todas as turmas</MenuItem>{classrooms.map(item=><MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
              <TextField select size="small" label="Professor" value={teacherId} onChange={event=>write({teacherId:event.target.value})}><MenuItem value="">Todos os professores</MenuItem>{teachers.map(item=><MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
              <TextField select size="small" label="Situação da aula" value={status} onChange={event=>write({status:event.target.value})}><MenuItem value="">Todas</MenuItem>{['Agendada','Realizada','Cancelada'].map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
              <TextField size="small" type="date" label="Aulas de" InputLabelProps={{shrink:true}} value={dateFrom} onChange={event=>write({dateFrom:event.target.value})} error={invalidDates}/>
              <TextField size="small" type="date" label="Aulas até" InputLabelProps={{shrink:true}} value={dateTo} onChange={event=>write({dateTo:event.target.value})} error={invalidDates}/>
            </Box><Stack direction="row" gap={1} sx={{mt:2}}><Button type="submit" variant="contained">Buscar aulas</Button><Button onClick={()=>{setDraft('');write({search:'',classroomId:'',teacherId:'',status:'',dateFrom:'',dateTo:''});}}>Limpar filtros</Button></Stack>
          </Box>
        }
      >
        {tableData.map((row) => (
          <LessonTableRow
            key={row.id}
            row={row}
            selected={table.selected.includes(row.id)}
            onSelectRow={() => table.onSelectRow(row.id)}
            onDeleteRow={() => handleDeleteRow(row.id)}
          />
        ))}
      </CustomTable>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir aulas"
        content={<>Tem certeza? <strong>{table.selected.length}</strong> aula(s) serão excluídas.</>}
        action={
          <Button variant="contained" color="error" onClick={() => { handleDeleteRows(); confirm.onFalse(); }}>
            Excluir
          </Button>
        }
      />
    </DashboardContent>
  );
}
