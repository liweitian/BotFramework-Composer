// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Create WebSocket connection.
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';

import { dispatcherState } from './recoilModel';
import { getExtension, getBaseName } from './utils/fileUtil';

type FileType = 'lg' | 'lu' | 'qna' | 'appsettings';
type Operation = 'create' | 'update' | 'delete';

export const WebSocketComponent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { updateQnAFile, createQnAFile, removeQnAFile } = useRecoilValue(dispatcherState);
  const operation = {
    qna: {
      create: (data) => {
        const id = getBaseName(getBaseName(data.filename));
        createQnAFile({ ...data, id });
      },
      update: (data) => {
        const id = getBaseName(data.filename);
        updateQnAFile({ ...data, id });
      },
      remove: removeQnAFile,
    },
  };
  const doOperation = (fileType: FileType, opType: Operation, data) => {
    console.log('operation data', data);
    if (operation[fileType]) {
      operation[fileType][opType](data);
    }
  };

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:5000/getBotUpdate`);
    // Connection opened
    ws.onopen = () => {
      ws.send(JSON.stringify(projectId));
    };
    ws.onerror = (error) => {
      console.log(error);
    };

    // Listen for messages
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { filename, op, msg, status } = data;
      console.log(data);
      if (status === 'success') {
        ws.send(JSON.stringify(projectId));
      } else if (status === 'sync') {
        const fileType: FileType = getExtension(filename) as FileType;
        doOperation(fileType, op, { ...data, projectId });
      }

      // if (getExtension(filename) === 'qna') {
      //   console.log(filename, content);
      //   updateQnAFile({ id: getBaseName(filename), projectId, content });
      // }
    };

    return () => {
      if (ws.readyState === ws.OPEN) {
        console.log('websocket about to close');
        ws.close();
      }
    };
  }, []);
  return null;
};
