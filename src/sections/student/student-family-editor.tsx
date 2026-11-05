'use client';
import type { StudentFamilyContact } from 'src/types/services/student';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AddressSection, parseAddressFromApi } from './student-address-section';
export function StudentFamilyEditor({contacts,onChange,onContractant}:{contacts:StudentFamilyContact[];onChange:(items:StudentFamilyContact[])=>void;onContractant:(contact:StudentFamilyContact)=>void}){
 const label=(type:string)=>type==='father'?'Pai':type==='mother'?'Mãe':'Outro responsável';
 const patch=(index:number,changes:Partial<StudentFamilyContact>)=>onChange(contacts.map((item,i)=>i===index?{...item,...changes}:item));
 return <Stack spacing={2}><Typography variant="body2" color="text.secondary">Filiação e contatos adicionais. Você pode copiar os dados de uma pessoa para o contratante financeiro.</Typography><Stack direction="row" gap={1} flexWrap="wrap">{(['father','mother','other'] as const).map(type=><Button key={type} variant="outlined" disabled={contacts.length>=20||type!=='other'&&contacts.some(c=>c.type===type)} onClick={()=>onChange([...contacts,{type,name:'',phoneNumber:'',email:'',cpf:'',rg:'',relationship:type==='other'?'':label(type),address:parseAddressFromApi(null)}])}>Adicionar {label(type).toLowerCase()}</Button>)}</Stack>{contacts.map((contact,index)=><Card key={index} component="section" aria-label={`${label(contact.type)} ${index+1}`} variant="outlined" sx={{p:{xs:2,sm:3},boxShadow:'none'}}><Stack spacing={2}><Typography variant="subtitle1">{label(contact.type)}</Typography><Box display="grid" gridTemplateColumns={{xs:'1fr',sm:'1fr 1fr'}} gap={2}>{([['name','Nome *'],['phoneNumber','Telefone'],['email','E-mail'],['cpf','CPF'],['rg','RG'],['relationship','Parentesco / vínculo']] as const).map(([key,title])=><TextField key={key} label={title} value={contact[key]??''} type={key==='email'?'email':'text'} onChange={event=>patch(index,{[key]:event.target.value})}/>)}</Box><AddressSection value={parseAddressFromApi(contact.address)} onChange={value=>patch(index,{address:{...parseAddressFromApi(contact.address),...value}})} label={`Endereço de ${label(contact.type)}`}/><Stack direction="row" gap={1} flexWrap="wrap"><Button onClick={()=>onContractant(contact)} disabled={contact.name.trim().length<2}>Copiar dados para contratante</Button><Button color="error" onClick={()=>onChange(contacts.filter((_,i)=>i!==index))}>Remover contato</Button></Stack></Stack></Card>)}</Stack>;
}
