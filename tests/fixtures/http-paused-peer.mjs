import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const mode=process.argv[2];
const body=Buffer.alloc(64*1024,'x');
const chunked=mode.includes('chunked');
const truncated=mode.startsWith('truncated');
const server=createServer(socket=>{
  socket.once('data',()=>{
    const framing=chunked?'Transfer-Encoding: chunked\r\n':mode==='eof'?'':`Content-Length: ${body.length+(truncated?10:0)}\r\n`;
    socket.write(`HTTP/1.1 200 OK\r\n${framing}Connection: close\r\n\r\n${chunked?body.length.toString(16)+'\r\n':''}`);
    socket.write(body);
    socket.end(chunked?(truncated?'\r\n':'\r\n0\r\n\r\n'):'');
  });
  socket.on('error',()=>{});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/`);
  // Keep the body unread until after the peer closes, exercising backpressure.
  await delay(150);
  if(truncated)await assert.rejects(()=>response.text());
  else assert.equal(await response.text(),body.toString());
  console.log(`verified ${mode}`);
}finally{await new Promise(resolve=>server.close(resolve));}
