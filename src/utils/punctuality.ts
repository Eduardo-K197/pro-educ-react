import type { EntryListItem } from 'src/types/services/entry';
export function entryPunctuality(entry:EntryListItem){
 if(entry.punctuality!==undefined)return entry.punctuality;
 const originalValue=Number(entry.originalValue??entry.value);const raw=Number(entry.discount?.value);if(!Number.isFinite(originalValue)||!Number.isFinite(raw)||raw<=0)return null;
 const percent=['PERCENT','PERCENTAGE','PERCENTUAL'].includes(String(entry.discount?.type??'FIXED').toUpperCase());if(percent&&raw>100)return null;
 const discountValue=Math.round((percent?originalValue*raw/100:raw)*100)/100;if(discountValue>originalValue)return null;
 let deadline=entry.discount?.limitDate?.slice(0,10)??entry.dueDate?.slice(0,10)??null;
 if(deadline&&!entry.discount?.limitDate&&Number(entry.discount?.dueDateLimitDays)>0){const d=new Date(deadline+'T12:00:00Z');if(Number.isFinite(d.getTime())){d.setUTCDate(d.getUTCDate()-Number(entry.discount?.dueDateLimitDays));deadline=d.toISOString().slice(0,10);}}
 return {originalValue,discountValue,discountedValue:Math.round((originalValue-discountValue)*100)/100,deadline,eligible:false};
}
