export const BAUDS=[300,600,1200,2400,4800,9600,19200];
// XOR from the first byte after STX through ETX inclusive.
export function bcc(text){return [...text].reduce((value,ch)=>value^ch.charCodeAt(0),0);}
export function opticalExchange(baud=9600,aligned=true,corrupt=false){
 const z=BAUDS.indexOf(baud);if(z<0)throw Error('Unsupported baud');
 const body='1.8.0(012345.678*kWh)\r\n32.7.0(230.0*V)\r\n!\r\n\x03';const checksum=bcc(body);
 const steps=[{from:'Reader → meter',baud:300,wire:'/?!\r\n',note:'Request identification at 300 baud, 7E1.'}];
 if(!aligned)return [...steps,{from:'Reader',baud:300,wire:'',note:'Timeout: optical head is not aligned. Re-align and restart.',failed:true}];
 return [...steps,{from:'Meter → reader',baud:300,wire:`/EZR${z}SIM\r\n`,note:`Simulated identity; baud code ${z} proposes ${baud} baud. EZR is a fictional demonstration identifier.`},{from:'Reader → meter',baud:300,wire:`\x060${z}0\r\n`,note:`ACK: normal protocol, ${baud} baud, readout mode. Both endpoints then change speed.`},{from:'Meter → reader',baud,wire:'\x02'+body+String.fromCharCode(corrupt?checksum^1:checksum),note:corrupt?'BCC mismatch. Discard this reading and restart.':'BCC verified. Energy register accepted: 12,345.678 kWh.',failed:corrupt,complete:!corrupt}];
}
export function wireLabel(text){return [...text].map(c=>({'\x02':'<STX>','\x03':'<ETX>','\x06':'<ACK>','\r':'<CR>','\n':'<LF>\n'}[c]??(c.charCodeAt(0)<32||c.charCodeAt(0)>126?`<0x${c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase()}>`:c))).join('');}
// Ideal untagged Ethernet payload, full duplex. Includes one IFG per frame.
export function ethernetTransfer(bytes,mbps){
 if(!Number.isSafeInteger(bytes)||bytes<1||![10,100,1000].includes(mbps))throw Error('Invalid transfer');
 const frames=Math.ceil(bytes/1500),last=bytes-(frames-1)*1500;
 const wireBytes=(frames-1)*1538+Math.max(46,last)+38;
 return {frames,wireBytes,seconds:wireBytes*8/(mbps*1e6),payloadMbps:mbps*bytes/wireBytes,efficiency:bytes/wireBytes};
}
