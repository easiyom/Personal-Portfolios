import test from 'node:test';import assert from 'node:assert/strict';
import {bcc,opticalExchange,ethernetTransfer,BAUDS} from '../site/lab-models.js';
import {validateProject,imageURL} from '../site/project-model.js';
import fs from 'node:fs';import vm from 'node:vm';
test('Mode C requests, baud selection, checksum and accepted data',()=>{
 for(const baud of BAUDS){const steps=opticalExchange(baud);assert.equal(steps[0].wire,'/?!\r\n');assert.equal(steps[2].wire,`\x060${BAUDS.indexOf(baud)}0\r\n`);const f=steps.at(-1).wire;assert.equal(f[0],'\x02');assert.equal(f.charCodeAt(f.length-1),bcc(f.slice(1,-1)));assert.equal(steps.at(-1).baud,baud);assert.ok(steps.at(-1).complete);}
 // Independent XOR fixture, excludes STX and includes ETX.
 assert.equal(bcc('ABC\x03'),0x43);
});
test('Optical alignment and corruption fail without accepted energy',()=>{const timeout=opticalExchange(9600,false);assert.equal(timeout.length,2);assert.ok(timeout.at(-1).failed);const bad=opticalExchange(9600,true,true).at(-1);assert.ok(bad.failed);assert.ok(!bad.complete);assert.notEqual(bad.wire.charCodeAt(bad.wire.length-1),bcc(bad.wire.slice(1,-1)));});
test('Ethernet byte-times include minimum padding and frame boundaries',()=>{assert.equal(ethernetTransfer(1,10).wireBytes,84);assert.equal(ethernetTransfer(1500,10).wireBytes,1538);assert.equal(ethernetTransfer(1501,10).wireBytes,1622);assert.equal(ethernetTransfer(3000,10).frames,2);assert.equal(ethernetTransfer(1500,1000).seconds,0.000012304);});
test('Same payload takes 10x and 100x longer on slower links',()=>{const a=ethernetTransfer(10000000,10),b=ethernetTransfer(10000000,100),c=ethernetTransfer(10000000,1000);assert.ok(Math.abs(a.seconds/b.seconds-10)<1e-10);assert.ok(Math.abs(a.seconds/c.seconds-100)<1e-10);assert.ok(c.payloadMbps<1000);assert.throws(()=>ethernetTransfer(-1,10));});
test('Project defaults validate and image URLs reject active schemes',()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync('site/content.js','utf8'),ctx);for(const p of ctx.window.PORTFOLIO.projects)assert.doesNotThrow(()=>validateProject(p));assert.equal(imageURL('javascript:alert(1)'),'');assert.equal(imageURL('data:text/html,test'),'');assert.equal(imageURL('../a.jpg'),'');assert.equal(imageURL('https://a.test/photo.jpg'),'https://a.test/photo.jpg');assert.throws(()=>validateProject({id:'bad id'}));});
