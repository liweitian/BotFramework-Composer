// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Request, Response } from 'express';
import { PluginLoader } from '@bfc/plugin-loader';

import StorageService from '../services/storage';
import { Path } from '../utility/path';

function getStorageConnections(req: Request, res: Response) {
  res.status(200).json(StorageService.getStorageConnections());
}

function createStorageConnection(req: Request, res: Response) {
  StorageService.createStorageConnection(req.body);
  res.status(200).json(StorageService.getStorageConnections());
}

function updateCurrentPath(req: Request, res: Response) {
  res.status(200).json(StorageService.updateCurrentPath(req.body.path, req.body.storageId));
}

function createFolder(req: Request, res: Response) {
  try {
    StorageService.createFolder(req.body.path);
    res.status(200).json({ message: 'success' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

function updateFolder(req: Request, res: Response) {
  try {
    StorageService.updateFolder(req.body.path, req.body.oldName, req.body.newName);
    res.status(200).json({ message: 'success' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function getBlob(req: Request, res: Response) {
  const storageId = req.params.storageId;
  const user = await PluginLoader.getUserFromRequest(req);

  try {
    if (!req.query.path) {
      throw new Error('path missing from query');
    }
    const reqpath = decodeURI(req.query.path);
    if (!Path.isAbsolute(reqpath)) {
      throw new Error('path must be absolute');
    }
    res.status(200).json(await StorageService.getBlob(storageId, reqpath, user));
  } catch (e) {
    res.status(400).json({
      message: e instanceof Error ? e.message : e,
    });
  }
}

export const StorageController = {
  getStorageConnections,
  createFolder,
  updateFolder,
  createStorageConnection,
  getBlob,
  updateCurrentPath,
};
