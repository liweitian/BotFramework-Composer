// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Create WebSocket connection.
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';

import { dispatcherState } from './recoilModel';
import { getExtension, getBaseName } from './utils/fileUtil';
export const WebSocketComponent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { updateQnAFile } = useRecoilValue(dispatcherState);
  useEffect(() => {
    console.log(projectId);
    const ws = new WebSocket(`ws://localhost:5000/getBotUpdate/${projectId}`);
    console.log(ws);
    // Connection opened
    ws.onopen = () => {
      ws.send(projectId);
    };
    ws.onerror = function (error) {
      console.log(error);
    };

    // Listen for messages
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { filename, content } = data;
      if (getExtension(filename) === 'qna') {
        console.log(filename, content);
        updateQnAFile({ id: getBaseName(filename), projectId, content });
      }
    };

    return () => {
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
    };
  }, [projectId]);
  return null;
};
