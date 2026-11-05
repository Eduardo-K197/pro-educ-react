'use client';
import { useEffect, useRef } from 'react';
import { usePathname,useRouter,useSearchParams } from 'next/navigation';
export function useListQuery(onReset:()=>void){
 const params=useSearchParams();const pathname=usePathname();const router=useRouter();const pending=useRef(params.toString());const reset=useRef(onReset);reset.current=onReset;
 useEffect(()=>{pending.current=params.toString();},[params]);
 const write=(changes:Record<string,string>)=>{const query=new URLSearchParams(pending.current);for(const [key,value] of Object.entries(changes))if(value)query.set(key,value);else query.delete(key);pending.current=query.toString();reset.current();router.replace(`${pathname}${query.size?'?'+query:''}`,{scroll:false});};
 return {params,write};
}
