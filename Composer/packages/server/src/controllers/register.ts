// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { BotProject } from '../models/bot/botProject';
import WebSocket from '../../node_modules/@types/ws';

export interface User {
  currentBotId: string;
  ip: string;
  ws: WebSocket;
}

export function getExtension(filename: string) {
  if (typeof filename === 'string') {
    return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
  }
  return filename;
}

class Register {
  private users: { [key: string]: User } = {};
  private projectCache: { [key: string]: BotProject } = {};

  //currently we use address to identify user
  public registerUser(user: User) {
    this.users[user.ip] = user;
    // console.log(this.users);
    //console.log(this.projectCache);
  }

  public registerBot(id: string, bot: BotProject) {
    this.projectCache[id] = bot;
  }

  public updateUserProject(ip: string, projectId: string) {
    this.users[ip].currentBotId = projectId;
  }

  public notifyChanges(data: { botId: string; filename: string; content?: string; op: string; status: string }) {
    const { botId } = data;
    const users = this.getUser(botId);
    const keys = Object.keys(users);
    for (let i = 0; i < keys.length; i++) {
      //console.log('目标： ', users[keys[i]]);
      // const project = this.projectCache[users[keys[i]].currentBotId];
      // const extension = getExtension(filename);
      // const file = project.getFile(filename);
      //console.log(filename, content);
      users[keys[i]].ws.send(JSON.stringify(data));
    }
  }

  private getUser(botId: string) {
    const keys = Object.keys(this.users);
    const users = {};
    for (let i = 0; i < keys.length; i++) {
      if (this.users[keys[i]].currentBotId === botId) {
        users[keys[i]] = this.users[keys[i]];
      }
    }
    return users;
  }
}

export default new Register();
