'use client';
import type { StudentDetail, StudentFamilyContact } from 'src/types/services/student';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import LoadingButton from '@mui/lab/LoadingButton';
import { paths } from 'src/routes/paths';
import { studentStatusValue, STUDENT_STATUS_OPTIONS } from 'src/utils/student-status';
import { StudentService } from 'src/services/student';
import { ApiService } from 'src/services/api/api';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { AddressSection, parseAddressFromApi } from './student-address-section';
import { StudentFamilyEditor } from './student-family-editor';
import { StudentCameraDialog } from './student-camera-dialog';
const optionalEmail=zod.string().email('Informe um e-mail válido').or(zod.literal(''));
const schema=zod.object({name:zod.string().trim().min(2,'Informe o nome do aluno'),email:optionalEmail,phone:zod.string(),birthDate:zod.string().min(1,'Informe a data de nascimento'),gender:zod.string().min(1,'Selecione o gênero'),cpf:zod.string(),rg:zod.string(),status:zod.string(),guardianName:zod.string(),guardianPhone:zod.string(),guardianEmail:optionalEmail,guardianRelationship:zod.string(),guardianCpf:zod.string(),guardianRg:zod.string(),additionalInformation:zod.string().max(10000,'Use até 10 mil caracteres')});
type Values=zod.infer<typeof schema>;
export function StudentNewEditForm({currentStudent}:{currentStudent?:StudentDetail}){
 const router=useRouter();const [tab,setTab]=useState(0);const [addr,setAddr]=useState(()=>parseAddressFromApi(currentStudent?.address));const [guardianAddr,setGuardianAddr]=useState(()=>parseAddressFromApi(currentStudent?.guardian?.address));
 const [family,setFamily]=useState<StudentFamilyContact[]>(currentStudent?.familyContacts??[]);const [tags,setTags]=useState<string[]>(currentStudent?.tags??[]);const [tagInput,setTagInput]=useState('');const [suggestions,setSuggestions]=useState<string[]>([]);
 const [photo,setPhoto]=useState<File|null>(null);const [preview,setPreview]=useState(currentStudent?.picture?.url??currentStudent?.pictureUrl??'');const [camera,setCamera]=useState(false);const gallery=useRef<HTMLInputElement>(null);const captureInput=useRef<HTMLInputElement>(null);const objectUrl=useRef('');
 const methods=useForm<Values>({resolver:zodResolver(schema),defaultValues:{name:currentStudent?.name??'',email:currentStudent?.email??'',phone:currentStudent?.phoneNumber??currentStudent?.phone??'',birthDate:currentStudent?.birthDate?.slice(0,10)??'',gender:currentStudent?.gender??'',cpf:currentStudent?.cpf??'',rg:currentStudent?.rg??'',status:studentStatusValue(currentStudent?.status)||'Ativo',guardianName:currentStudent?.guardian?.name??'',guardianPhone:currentStudent?.guardian?.phoneNumber??currentStudent?.guardian?.phone??'',guardianEmail:currentStudent?.guardian?.email??'',guardianRelationship:currentStudent?.guardian?.relationship??'',guardianCpf:currentStudent?.guardian?.cpf??'',guardianRg:currentStudent?.guardian?.rg??'',additionalInformation:currentStudent?.additionalInformation??''}});
 const {handleSubmit,setValue,formState:{isSubmitting}}=methods;
 useEffect(()=>()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);},[]);
 useEffect(()=>{const controller=new AbortController();const timer=setTimeout(()=>{ApiService.get<{tags:string[]}>('/student-tags',{search:tagInput},{signal:controller.signal}).then(data=>setSuggestions(data.tags??[])).catch(()=>{});},250);return()=>{clearTimeout(timer);controller.abort();};},[tagInput]);
 const choosePhoto=(file:File)=>{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){toast.error('Envie uma imagem JPG, PNG ou WebP de até 5 MB.');return;}if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=URL.createObjectURL(file);setPhoto(file);setPreview(objectUrl.current);};
 const copyContact=(contact:StudentFamilyContact)=>{setValue('guardianName',contact.name,{shouldDirty:true});setValue('guardianPhone',contact.phoneNumber??'',{shouldDirty:true});setValue('guardianEmail',contact.email??'',{shouldDirty:true});setValue('guardianCpf',contact.cpf??'',{shouldDirty:true});setValue('guardianRg',contact.rg??'',{shouldDirty:true});setValue('guardianRelationship',contact.relationship??'',{shouldDirty:true});setGuardianAddr(parseAddressFromApi(contact.address));setTab(1);toast.success('Dados copiados para o contratante. Confira antes de salvar.');};
 const submit=handleSubmit(async values=>{
  if(family.some(c=>c.name.trim().length<2)){setTab(2);toast.error('Informe o nome dos contatos adicionados ou remova os que estão vazios.');return;}
  const cleanTags=Array.from(new Map(tags.map(tag=>[tag.trim().toLocaleLowerCase('pt-BR'),tag.trim()])).values()).filter(Boolean);
  if(cleanTags.length>20||cleanTags.some(tag=>tag.length>50)){toast.error('Use até 20 tags, com até 50 caracteres cada.');return;}
  const guardian=values.guardianName.trim()?{name:values.guardianName.trim(),phoneNumber:values.guardianPhone,email:values.guardianEmail,cpf:values.guardianCpf,rg:values.guardianRg,relationship:values.guardianRelationship,address:guardianAddr}:undefined;
  const payload={name:values.name,email:values.email||undefined,phoneNumber:values.phone||undefined,birthDate:values.birthDate,gender:values.gender,cpf:values.cpf||undefined,rg:values.rg||undefined,status:values.status,address:addr,guardian,familyContacts:family,tags:cleanTags,additionalInformation:values.additionalInformation};
  try{if(photo){const form=new FormData();for(const [key,value] of Object.entries(payload)){if(value!==undefined)form.append(key,typeof value==='object'?JSON.stringify(value):String(value));}form.append('picture',photo);if(currentStudent)await StudentService.updateMultipart(currentStudent.id,form);else await StudentService.createMultipart(form);}else if(currentStudent)await StudentService.update(currentStudent.id,payload);else await StudentService.create(payload);
   toast.success(currentStudent?'Aluno atualizado com sucesso.':'Aluno cadastrado com sucesso.');router.push(currentStudent?paths.dashboard.students.details(String(currentStudent.id)):paths.dashboard.students.root);
  }catch(error:any){toast.error(error?.response?.data?.message??'Não foi possível salvar o cadastro. Confira os campos e tente novamente.');}
 },errors=>{setTab(Object.keys(errors).some(key=>key.startsWith('guardian'))?1:Object.keys(errors).includes('additionalInformation')?3:0);toast.error('Confira os campos destacados antes de salvar.');});
 return <Form methods={methods} onSubmit={submit}><Card sx={{p:{xs:2,md:3}}}><Tabs value={tab} onChange={(_,value)=>setTab(value)} variant="scrollable" allowScrollButtonsMobile aria-label="Seções do cadastro do aluno" sx={{mb:3}}>{['Aluno','Contratante','Filiação e responsáveis','Outras informações'].map(title=><Tab key={title} label={title}/>)}</Tabs>
 <Stack spacing={3} sx={{display:tab===0?'flex':'none'}}><Stack direction={{xs:'column',sm:'row'}} gap={2} alignItems={{sm:'center'}}><Avatar src={preview||undefined} sx={{width:96,height:96}}>{methods.watch('name')?.charAt(0)}</Avatar><Stack spacing={1}><Typography variant="subtitle1">Foto do aluno</Typography><Stack direction="row" gap={1} flexWrap="wrap"><Button type="button" variant="outlined" onClick={()=>gallery.current?.click()}>Enviar foto</Button><Button type="button" onClick={()=>setCamera(true)}>Tirar foto</Button></Stack><Typography variant="caption" color="text.secondary">JPG, PNG ou WebP · até 5 MB</Typography></Stack></Stack>
 <input ref={gallery} type="file" aria-label="Enviar foto do aluno" accept="image/jpeg,image/png,image/webp" hidden onChange={event=>{const file=event.target.files?.[0];if(file)choosePhoto(file);event.target.value='';}}/>
 <input ref={captureInput} type="file" aria-label="Câmera do aparelho" accept="image/*" capture="user" hidden onChange={event=>{const file=event.target.files?.[0];if(file)choosePhoto(file);event.target.value='';}}/>
 <Box display="grid" gridTemplateColumns={{xs:'1fr',sm:'1fr 1fr'}} gap={2}><Field.Text name="name" label="Nome completo *"/><Field.Select name="status" label="Situação">{STUDENT_STATUS_OPTIONS.map(option=><MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</Field.Select><Field.Text name="birthDate" label="Data de nascimento *" type="date" InputLabelProps={{shrink:true}}/><Field.Select name="gender" label="Gênero *"><MenuItem value="">Selecione</MenuItem>{[['male','Masculino'],['female','Feminino'],['other','Outro']].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}{currentStudent?.gender&&!['male','female','other'].includes(currentStudent.gender)&&<MenuItem value={currentStudent.gender}>{currentStudent.gender}</MenuItem>}</Field.Select><Field.Text name="email" label="E-mail"/><Field.Text name="phone" label="Telefone"/><Field.Text name="cpf" label="CPF"/><Field.Text name="rg" label="RG"/></Box>
 <Autocomplete multiple freeSolo onKeyDown={event=>{if(event.key==='Enter'&&tagInput.trim())event.preventDefault();}} filterSelectedOptions options={suggestions} value={tags} inputValue={tagInput} onInputChange={(_,value)=>setTagInput(value)} onChange={(_,value)=>setTags(Array.from(new Map(value.map(tag=>[tag.trim().toLocaleLowerCase('pt-BR'),tag.trim()])).values()).filter(Boolean))} renderTags={(value,getTagProps)=>value.map((tag,index)=><Chip label={tag} {...getTagProps({index})} key={tag}/>)} renderInput={params=><TextField {...params} label="Tags do aluno" helperText="Digite uma tag e pressione Enter. As tags cadastradas aparecem como sugestão nesta escola."/>}/>
 <Typography variant="h6">Endereço do aluno</Typography><AddressSection value={addr} onChange={patch=>setAddr(previous=>({...previous,...patch}))} label="Endereço do aluno"/></Stack>
 <Stack spacing={2.5} sx={{display:tab===1?'flex':'none'}}><Typography variant="h6">Contratante (responsável financeiro)</Typography><Typography variant="body2" color="text.secondary">Pode ser pai, mãe ou outra pessoa. Os contatos de filiação ficam separados na próxima aba.</Typography><Box display="grid" gridTemplateColumns={{xs:'1fr',sm:'1fr 1fr'}} gap={2}>{[['guardianName','Nome do contratante'],['guardianPhone','Telefone do contratante'],['guardianEmail','E-mail do contratante'],['guardianCpf','CPF do contratante'],['guardianRg','RG do contratante'],['guardianRelationship','Parentesco / vínculo']].map(([name,label])=><Field.Text key={name} name={name} label={label}/>)}</Box><Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap"><Typography variant="h6">Endereço do contratante</Typography><Button type="button" onClick={()=>setGuardianAddr({...addr})}>Importar mesmo endereço do aluno</Button></Stack><AddressSection value={guardianAddr} onChange={patch=>setGuardianAddr(previous=>({...previous,...patch}))} label="Endereço do contratante"/></Stack>
 <Box sx={{display:tab===2?'block':'none'}}><StudentFamilyEditor contacts={family} onChange={setFamily} onContractant={copyContact}/></Box>
 <Box sx={{display:tab===3?'block':'none'}}><Field.Text name="additionalInformation" label="Outras informações" multiline minRows={5} inputProps={{maxLength:10000}} helperText="Informações complementares para a secretaria."/></Box>
 <Stack direction="row" justifyContent="flex-end" gap={1} sx={{mt:3}}><Button color="inherit" onClick={()=>router.back()}>Cancelar</Button><LoadingButton type="submit" variant="contained" loading={isSubmitting}>{currentStudent?'Salvar alterações':'Cadastrar aluno'}</LoadingButton></Stack></Card>{camera&&<StudentCameraDialog onClose={()=>setCamera(false)} onPhoto={choosePhoto} onFallback={()=>captureInput.current?.click()}/>}</Form>;
}
