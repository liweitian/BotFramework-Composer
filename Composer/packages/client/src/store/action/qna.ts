// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import clonedeep from 'lodash/cloneDeep';
import { QnAFile } from '@bfc/shared';

import qnaWorker from '../parsers/qnaWorker';
import { undoable } from '../middlewares/undo';
import { ActionCreator, State, Store, QnAAllUpViewStatus } from '../types';
import { ActionTypes } from '../../constants';
import httpClient from '../../utils/httpUtil';

import { setError } from './error';
export const updateQnaFile: ActionCreator = async (store, { id, projectId, content }) => {
  const qnaFile = (await qnaWorker.parse(id, content)) as QnAFile;
  store.dispatch({
    type: ActionTypes.UPDATE_QNA,
    payload: { id, projectId, content, qnaFile },
  });
};

export const removeQnAFile: ActionCreator = async (store, id) => {
  store.dispatch({
    type: ActionTypes.REMOVE_QNA,
    payload: { id },
  });
};

export const createQnAFile: ActionCreator = async (store, { id, content }) => {
  store.dispatch({
    type: ActionTypes.CREATE_QNA,
    payload: { id, content },
  });
};

export const undoableUpdateQnaFile = undoable(
  updateQnaFile,
  (state: State, args: any[], isEmpty) => {
    if (isEmpty) {
      const id = args[0].id;
      const projectId = args[0].projectId;
      const content = clonedeep(state.qnaFiles.find((qnaFile) => qnaFile.id === id)?.content);
      return [{ id, projectId, content }];
    } else {
      return args;
    }
  },
  async (store: Store, from, to) => updateQnaFile(store, ...to),
  async (store: Store, from, to) => updateQnaFile(store, ...to)
);

export const updateQnAContent: ActionCreator = async (store, { projectId, file, content }) => {
  return await undoableUpdateQnaFile(store, { id: file.id, projectId, content });
};

export const importQnAFromUrl: ActionCreator = async (
  store,
  { projectId, id, qnaFileContent, subscriptionKey, url, region }
) => {
  store.dispatch({
    type: ActionTypes.SET_QNA_UPDATE_STATUS,
    payload: { status: QnAAllUpViewStatus.Loading },
  });
  try {
    const response = await httpClient.get(`/qnaContent`, { params: { subscriptionKey, url, region } });
    const content = qnaFileContent ? qnaFileContent + '\n' + response.data : response.data;
    const qnaFile = (await qnaWorker.parse(id, content)) as QnAFile;
    store.dispatch({
      type: ActionTypes.UPDATE_QNA,
      payload: { id, projectId, content, qnaFile },
    });
  } catch (err) {
    setError(store, {
      message: err.message,
      summary: `Failed to import QnA`,
    });
  }
  store.dispatch({
    type: ActionTypes.SET_QNA_UPDATE_STATUS,
    payload: { status: QnAAllUpViewStatus.Success },
  });
};
