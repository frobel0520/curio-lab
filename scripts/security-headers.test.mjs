import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {MAINTENANCE_SCRIPT,MAX_HEADER_VALUE,inlineScriptHashes,renderHeaders,unexpectedExternalScripts} from './security-headers.mjs';

const hash=body=>`'sha256-${createHash('sha256').update(body).digest('base64')}'`;
const pageA=`<html><head><script src="/_next/static/a.js" async=""></script><script src="${MAINTENANCE_SCRIPT}" data-project="curio-lab"></script></head><body><script id="_R_">boot()</script><script>self.__next_f.push([0])</script></body></html>`;
const pageB='<html><body><script>self.__next_f.push([0])</script><script>self.__next_f.push([1,"b"])</script></body></html>';

test('hashes every inline script once and ignores external scripts',()=>{
 assert.deepEqual(inlineScriptHashes([pageA,pageB]),[hash('boot()'),hash('self.__next_f.push([0])'),hash('self.__next_f.push([1,"b"])')].sort());
});

test('rejects external script origins other than same-origin paths and the Harbor embed',()=>{
 assert.deepEqual(unexpectedExternalScripts([pageA]),[]);
 assert.deepEqual(unexpectedExternalScripts(['<script src="https://cdn.example.com/x.js"></script><script src="//evil.example.com/y.js"></script>']),['https://cdn.example.com/x.js','//evil.example.com/y.js']);
 assert.throws(()=>renderHeaders("/*\n  Content-Security-Policy: base-uri 'self'\n",['<script src="https://cdn.example.com/x.js"></script>']),/Unexpected external script/);
});

test('adds a strict script-src while keeping the existing CSP directives',async()=>{
 const template=await readFile(new URL('../public/_headers',import.meta.url),'utf8');
 const output=renderHeaders(template,[pageA,pageB]);
 const csp=/Content-Security-Policy: (.+)/.exec(output)[1];
 const script=csp.split('; ').find(part=>part.startsWith('script-src ')).split(' ');
 assert.deepEqual(script.slice(0,3),['script-src',"'self'",MAINTENANCE_SCRIPT]);
 for(const forbidden of ["'unsafe-inline'","'unsafe-eval'",'*','https:','http:','data:','blob:'])assert.ok(!script.includes(forbidden),forbidden);
 assert.ok(script.includes(hash('boot()')));
 for(const directive of ["base-uri 'self'","object-src 'none'","frame-ancestors 'none'"])assert.ok(csp.includes(directive),directive);
 assert.ok(csp.length<=MAX_HEADER_VALUE);
 assert.equal(output.replace(/Content-Security-Policy: .+/,''),template.replace(/Content-Security-Policy: .+/,''),'other headers are untouched');
});

test('public/_headers declares Permissions-Policy and COOP for the Harbor website checks',async()=>{
 const template=await readFile(new URL('../public/_headers',import.meta.url),'utf8');
 const policy=/Permissions-Policy: (.+)/.exec(template)?.[1]??'';
 for(const feature of ['camera=()','microphone=()','geolocation=()','payment=()','usb=()'])assert.ok(policy.includes(feature),feature);
 // 結果頁使用 navigator.share 與 navigator.clipboard.writeText，必須保留同源權限。
 for(const feature of ['web-share=(self)','clipboard-write=(self)'])assert.ok(policy.includes(feature),feature);
 assert.match(template,/^\s+Cross-Origin-Opener-Policy: same-origin$/m);
});

test('fails loudly instead of emitting an oversized or ambiguous CSP',()=>{
 const many=Array.from({length:60},(_v,i)=>`<script>page${i}()</script>`);
 assert.throws(()=>renderHeaders("/*\n  Content-Security-Policy: base-uri 'self'\n",many),/over Cloudflare/);
 assert.throws(()=>renderHeaders('/*\n  X-Frame-Options: DENY\n',[pageB]),/exactly one/);
});
