import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from '../user/user.service';
import Peer from 'peerjs';

import { GameCommand } from 'src/app/logger/commands';
import { first, skip } from 'rxjs/operators';


@Injectable()
export class PeerService {

  public peer;

  private connections: ConnectionsMap;


  constructor(private user: UserService) { }

  private connectionCounter = 0;

  async requestId() {
    await this.user.onSync();

    this.connections = new ConnectionsMap();

    // const peerOptions = { host: 'localhost', port: 9000,  path: '/tetrion-peer'  }

    if (!this.user.config.peer.signal || this.user.config.peer.signal === undefined) {

      this.peer = new Peer();
      this.initEvents();
      return;
    }

    this.peer = new Peer(this.user.config.peer.signal);

    this.initEvents();


    return this.onPeerReady.pipe(skip(1), first()).toPromise();

  }


  private onPeerReady: BehaviorSubject<boolean> = new BehaviorSubject(false);


  private initEvents() {

    //on peer init
    this.peer.on('open', () => {

      if (this.peer.id !== this.user.config.peer.signal) {
        this.user.config.peer.signal = this.peer.id;
      }
      this.user.updateSignal();

      this.onPeerReady.next(true);
    });


    this.peer.on('connection', incoming => {


      const connection = this.connections.get(incoming.peer);
 

      if (!connection) {
        this.connections.addUnknownIncomingConnection(incoming);
      console.log('inc added')
        
        return;
      }

      if (connection.incoming) {
        // console.log('Connection already exists!');
        return;
      }

      connection.incoming = incoming;

      incoming.on('data', (data: any) => {
        connection.onData.next(JSON.parse(data));
      });



      // this.connections.set(connection.peer, {
      //   id: connection.peer,
      //   username: 'undefined' + this.connectionCounter++,
      //   incoming: connection,
      //   createdAt: Date.now()
      // });

      // console.log('Incoming connection opened with peer ' + connection.peer);
    });


    this.peer.on('error', (error) => {
      
      if (error.message === `ID "${this.user.config.peer.signal}" is taken`) {

        this.peer = new Peer();
        // console.log(`The signal ${this.user.config.peer.signal} is taken. Changed to ${this.peer.id}.`);
        this.user.config.peer.signal = this.peer.id;
        this.user.updateSignal();

        this.initEvents();
        return;
      }
      console.error(error.message);
    });



  }


  send(username: string, object: any) {
    const connection = this.connections.getByUsername(username);

    if (connection.outcoming) {
      connection.outcoming.send(JSON.stringify(object));
    }
 

  }


  connect(params: { username: string, id: string }): Promise<Observable<GameCommand>> {

    return new Promise(resolve => {

      const onData = new BehaviorSubject(null);

      const obs: Observable<GameCommand> = new Observable((observer) => {
        onData.pipe(skip(1)).subscribe((data) => observer.next(data));
      });

      if (!this.connections.hasUsername(params.username)) {

        this.connections.set(params.id, {
          id: params.id,
          username: params.username,
          onData: onData,
          createdAt: Date.now()
        })

      } else if (this.connections.get(params.id).outcoming !== undefined) {

        // console.log('Outcoming connection already exists connect with: ' + params.id + '..');
        resolve(obs);
        return;
      }


      const connection = this.connections.get(params.id);
      this.connections.setUsername(params.username, params.id);

      connection.outcoming = this.peer.connect(params.id);

      const errors = [
        'browser-incompatible',
        'disconnected',
        'invalid-id',
        'invalid-key',
        'network',
        'peer-unavailable',
        'ssl-unavailable',
        'server-error',
        'socket-error',
        'socket-closed',
        'unavailable-id',
        'webrtc'
      ];

      for (const error of errors) {
        connection.outcoming.on(error, e => console.error(e));
      }

      connection.outcoming.on('open', () => {

        // console.log('Outcomming connection established with ' + params.id + '..')

        resolve(obs);

      });
    });

  }

  disconnect() {


    if (this.peer) {
      this.peer.disconnect();
    }
  }

}


export interface Client {
  username: string;
  signal: string;
}


export enum GameRequestType {
  ChallengeAccepted = 'CHALLENGE_ACCEPTED',
  ChallengeDeclined = 'CHALLENGE_DECLINED',
  GameSignaling = 'GAME_SIGNALING',
  GameChallenge = 'GAME_CHALLENGE',
  VerifyPeerConnection = "VERIFY_PEER_CONNECTION",
  QuickGame = "QUICK_GAME",
  GameReady = "GAME_READY"
}


export interface IPeerConnection {
  id: string;
  username?: string;
  incoming?: any;
  onData: BehaviorSubject<GameCommand>;
  outcoming?: any;
  createdAt: number;
}

export class ConnectionsMap extends Map {

  private clients: Map<string, string>;
  private unknownIncomingConnections: Array<any> = new Array();

  constructor() {
    super();
    this.clients = new Map();
  }

  addUnknownIncomingConnection(conn: any) {
    this.unknownIncomingConnections.push(conn);
  }




  set(id: any, value: IPeerConnection): this {
    super.set(id, value);

    let index = 0;
    for (const incoming of this.unknownIncomingConnections) {
      if (incoming.peer === id) {

        value.incoming = incoming;
        incoming.on('data', (data: any) => {
          value.onData.next(JSON.parse(data));
        });

        this.unknownIncomingConnections.splice(index, 1);
        break;
      }
      index++;
    }

    this.clients.set(value.username, id);

    return this;
  }


  get(id: string): IPeerConnection | undefined {
    return super.get(id);
  }


  has(id: string): boolean {
    return super.has(id);
  }


  hasUsername(username: string): boolean {
    return this.clients.has(username);
  }


  delete(id: string): boolean {
    if (!super.delete(id)) return false;

    for (const con of this.clients.entries()) {
      if (con[1] === id) {
        this.clients.delete(con[0]);
        break;
      }
    }

    return true;
  }


  getByUsername(username: string): IPeerConnection | undefined {
    const id = this.clients.get(username);
    return this.get(id);
  }


  setUsername(username: string, id: string) {

    if (this.clients.has(username)) return;

    for (const con of this.clients.entries()) {
      if (con[1] === id) {
        this.clients.delete(con[0]);
        this.clients.set(username, con[1]);
        this.get(con[1]).username = username;
        break;
      }
    }


    this.clients.set(username, id);

  }


  private deleteByUsername(username: string): boolean {
    const connnection = this.clients.get(username);

    if (!connnection) return;

    const id = connnection[1];

    this.delete(id);

    for (const con of this.clients.entries()) {
      if (con[1] === id) {
        this.clients.delete(con[0]);
        break;
      }
    }

    return true;
  }

}
