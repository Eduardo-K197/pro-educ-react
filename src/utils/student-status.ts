export const STUDENT_STATUS_OPTIONS=[{value:'Ativo',label:'Matriculado'},{value:'Cancelado',label:'Desistente'},{value:'Interessado',label:'Interessado'},{value:'Inativo',label:'Inativo'},{value:'Reservado',label:'Reservado'},{value:'Transferido',label:'Transferido'}];
const aliases:Record<string,string>={ativo:'Ativo',active:'Ativo',matriculado:'Ativo',cancelado:'Cancelado',canceled:'Cancelado',cancelled:'Cancelado',desistente:'Cancelado',inativo:'Inativo',inactive:'Inativo',interessado:'Interessado',interested:'Interessado',reservado:'Reservado',reserved:'Reservado',transferido:'Transferido',transferred:'Transferido',suspenso:'Suspenso',suspended:'Suspenso'};
export const studentStatusValue=(value?:string|null)=>aliases[String(value??'').trim().toLocaleLowerCase('pt-BR')]??value??'';
export const studentStatusLabel=(value?:string|null)=>STUDENT_STATUS_OPTIONS.find(option=>option.value===studentStatusValue(value))?.label??value??'Não informado';
export const studentIsEnrolled=(value?:string|null)=>studentStatusValue(value)==='Ativo';

export const STUDENT_STATUS_FILTERS=[...STUDENT_STATUS_OPTIONS,{value:'Suspenso',label:'Suspenso'}];
