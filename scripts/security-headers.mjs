// 建置後把 script-src 加進 out/_headers 的 CSP。
// Next.js 靜態匯出的每頁有少量內嵌 <script>（RSC payload），以 SHA-256 雜湊放行，不使用 'unsafe-inline'。
// public/_headers 是其餘標頭的來源；這支只改 Content-Security-Policy 那一行。
import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** Harbor 維護模式外掛（app/layout.tsx 以同步 script 載入），只放行這一個檔案。 */
export const MAINTENANCE_SCRIPT='https://harbor-1wk.pages.dev/embed/maintenance.js';
/** Cloudflare _headers 單一標頭值上限。 */
export const MAX_HEADER_VALUE=2000;

const INLINE_SCRIPT=/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const EXTERNAL_SCRIPT=/<script[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;

export function inlineScriptHashes(htmlPages) {
 const hashes=new Set();
 for(const html of htmlPages)for(const match of html.matchAll(INLINE_SCRIPT))hashes.add(`'sha256-${createHash('sha256').update(match[1]??'','utf8').digest('base64')}'`);
 return [...hashes].sort();
}

/** 外部 script 只能是同源路徑或 Harbor 維護外掛；其他來源讓建置失敗，避免靜默放寬 CSP。 */
export function unexpectedExternalScripts(htmlPages) {
 const found=new Set();
 for(const html of htmlPages)for(const match of html.matchAll(EXTERNAL_SCRIPT)){
  const src=match[1];
  if(src===MAINTENANCE_SCRIPT||(src.startsWith('/')&&!src.startsWith('//')))continue;
  found.add(src);
 }
 return [...found];
}

export function withScriptSrc(baseCsp,hashes) {
 const directives=baseCsp.split(';').map(part=>part.trim()).filter(part=>part!==''&&!/^script-src\s/i.test(part));
 directives.push(['script-src',"'self'",MAINTENANCE_SCRIPT,...hashes].join(' '));
 return directives.join('; ');
}

export function renderHeaders(template,htmlPages) {
 const extra=unexpectedExternalScripts(htmlPages);
 if(extra.length>0)throw new Error(`Unexpected external script source(s): ${extra.join(', ')}`);
 const hashes=inlineScriptHashes(htmlPages);
 let replaced=0;
 const output=template.replace(/^(\s+Content-Security-Policy:\s*)(.+)$/m,(_line,prefix,value)=>{
  replaced++;
  const csp=withScriptSrc(value,hashes);
  if(csp.length>MAX_HEADER_VALUE)throw new Error(`CSP is ${csp.length} chars, over Cloudflare's ${MAX_HEADER_VALUE}; split per-path rules`);
  return prefix+csp;
 });
 if(replaced!==1)throw new Error('public/_headers must contain exactly one Content-Security-Policy line');
 return output;
}

async function htmlFiles(dir) {
 const entries=await readdir(dir,{withFileTypes:true});
 const nested=await Promise.all(entries.map(entry=>{
  const path=join(dir,entry.name);
  return entry.isDirectory()?htmlFiles(path):entry.name.endsWith('.html')?[path]:[];
 }));
 return nested.flat();
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const pages=await Promise.all((await htmlFiles('out')).map(file=>readFile(file,'utf8')));
 if(pages.length===0)throw new Error('No HTML found in out/; run next build first');
 const headers=renderHeaders(await readFile('public/_headers','utf8'),pages);
 await writeFile('out/_headers',headers);
 console.log(`SECURITY_HEADERS pages=${pages.length} inlineHashes=${inlineScriptHashes(pages).length}`);
}
