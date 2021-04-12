// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as http from 'http';
// import * as url from 'url';

import * as ws from 'ws';

import Register, { User } from '../controllers/register';
import WebSocket from '../../node_modules/@types/ws';

export function attachPushServer(wss: ws.Server, server: http.Server, path: string) {
  server.on('upgrade', (request, socket, head) => {
    //const pathname = url.parse(request.url).pathname;
    const tokens = request.url.split('/');
    if (path === tokens[1]) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, tokens[2]);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request, projectId) => {
    // ws.on('message', (pId: ws.Data) => {
    //     // projectId = pId as string;
    //     //console.log('received: %s', pId);
    // });
    const user: User = {
      ip: request.headers.origin as string,
      currentBotId: projectId,
      ws: ws,
    };

    Register.registerUser(user);

    ws.send('something');

    // ws.on('close', () => {
    //     throw new Error('closed');
    // })
  });
}
