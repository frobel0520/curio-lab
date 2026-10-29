import {mkdir,writeFile} from 'node:fs/promises';

let report;
try {
 const response=await fetch('https://www.curio-lab.workers.dev',{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{accept:'text/html'}});
 const html=response.headers.get('content-type')?.toLowerCase().includes('text/html')===true;
 if(response.status!==200||!html)report={status:'unknown',reason:'NOT_HTML_200',httpStatus:response.status};
 else {
  const csp=response.headers.get('content-security-policy')??'';
  const directive=name=>csp.split(';').map(value=>value.trim().split(/\s+/)).find(parts=>parts[0]?.toLowerCase()===name)?.slice(1);
  const exactly=(name,value)=>{const values=directive(name);return values?.length===1&&values[0]===value;};
  const checks={cspPresent:!!csp.trim(),baseSelf:exactly('base-uri',"'self'"),objectNone:exactly('object-src',"'none'"),
   frameNone:exactly('frame-ancestors',"'none'"),xFrameDeny:response.headers.get('x-frame-options')?.trim().toUpperCase()==='DENY',
   noSniff:response.headers.get('x-content-type-options')?.trim().toLowerCase()==='nosniff'};
  report={status:Object.values(checks).every(Boolean)?'matched':'finding',httpStatus:200,checks};
 }
 await response.body?.cancel();
}catch{report={status:'unknown',reason:'REQUEST_UNAVAILABLE'};}
report={observedAt:new Date().toISOString(),...report,method:'anonymous_fixed_root_get',changesMade:false};
await mkdir('artifacts/published-headers',{recursive:true});
await writeFile('artifacts/published-headers/report.json',JSON.stringify(report,null,2)+'\n');
console.log('PUBLISHED_HEADER_AUDIT '+JSON.stringify(report));
