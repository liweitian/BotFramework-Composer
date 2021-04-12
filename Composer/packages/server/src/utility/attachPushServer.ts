// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as http from 'http';
import * as url from 'url';

import * as ws from 'ws';

import Register, { User } from '../controllers/register';
import WebSocket from '../../node_modules/@types/ws';

export function attachPushServer(wss: ws.Server, server: http.Server, path: string) {
  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? url.parse(request.url).pathname : undefined;
    console.log(path, pathname);
    if (path === pathname) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, request) => {
    ws.on('message', (data: ws.Data) => {
      if (typeof data === 'string') {
        const projectId = JSON.parse(data);
        console.log(request.headers.origin, projectId);
        Register.updateUserProject(request.headers.origin as string, projectId);
      }
    });
    const user: User = {
      ip: request.headers.origin as string,
      currentBotId: '',
      ws: ws,
    };

    Register.registerUser(user);

    ws.send(JSON.stringify({ msg: 'register User success', status: 'success' }));

    // ws.on('close', () => {
    //     throw new Error('closed');
    // })
  });
}
