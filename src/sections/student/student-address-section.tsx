'use client';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'src/components/snackbar';
export interface AddressFields {
  zipCode: string;
  street: string;
  number: string;
  county: string;   // bairro
  city: string;
  state: string;
  complement: string;
  reference: string;
  country: string;
}

export const emptyAddress = (): AddressFields => ({
  zipCode: '', street: '', number: '', county: '', city: '', state: '', complement: '', reference: '', country: 'BR',
});

export function parseAddressFromApi(raw: any): AddressFields {
  if (!raw) return emptyAddress();
  if (typeof raw === 'string') {
    try {
      return parseAddressFromApi(JSON.parse(raw));
    } catch {
      // string não é JSON válido — cai no fallback abaixo
    }
    return { ...emptyAddress(), street: raw };
  }
  return {
    zipCode: raw.zipCode ?? '',
    street: raw.street ?? '',
    number: raw.number ?? '',
    county: raw.county ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    complement: raw.complement ?? '', reference: raw.reference ?? '', country: raw.country ?? 'BR',
  };
}


export function AddressSection({ value, onChange, label = 'Endereço' }: {value: AddressFields; onChange:(patch:Partial<AddressFields>)=>void; label?:string}) {
 const [fetching,setFetching]=useState(false);const request=useRef<AbortController|null>(null);const current=useRef(value);current.current=value;
 useEffect(()=>()=>request.current?.abort(),[]);
 const fetchCep=async()=>{
  const digits=value.zipCode.replace(/\D/g,'');if(digits.length!==8){if(digits)toast.error('Informe um CEP com 8 dígitos.');return;}
  request.current?.abort();const controller=new AbortController();request.current=controller;const snapshot={...value};setFetching(true);
  try {const response=await fetch(`https://viacep.com.br/ws/${digits}/json/`,{signal:controller.signal});if(!response.ok)throw Error();const data=await response.json();if(controller.signal.aborted||current.current.zipCode.replace(/\D/g,'')!==digits)return;if(data.erro===true||data.erro==='true'){toast.error('CEP não encontrado. Você pode preencher o endereço manualmente.');return;}
   const patch:Partial<AddressFields>={};for(const [key,remote] of [['street','logradouro'],['county','bairro'],['city','localidade'],['state','uf']] as const)if(current.current[key]===snapshot[key]&&typeof data[remote]==='string'&&data[remote])patch[key]=data[remote];onChange(patch);
  }catch {if(!controller.signal.aborted)toast.error('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.');}finally{if(!controller.signal.aborted)setFetching(false);}
 };
 const fields=[['zipCode','CEP'],['street','Rua'],['number','Número'],['county','Bairro'],['city','Cidade'],['state','Estado (UF)'],['complement','Complemento'],['reference','Ponto de referência']] as const;
 return <Box role="group" aria-label={label} display="grid" gridTemplateColumns={{xs:'1fr',sm:'1fr 1fr'}} gap={2}>{fields.map(([key,title])=><TextField key={key} fullWidth label={title} value={value[key]} onChange={event=>{if(key==='zipCode'){request.current?.abort();setFetching(false);}onChange({[key]:key==='state'?event.target.value.toUpperCase():event.target.value});}} onBlur={key==='zipCode'?fetchCep:undefined} inputProps={{maxLength:key==='zipCode'?9:key==='state'?2:key==='number'?40:250}} InputProps={key==='zipCode'?{endAdornment:fetching?<CircularProgress size={18}/>:null}:undefined}/>)}</Box>;
}
