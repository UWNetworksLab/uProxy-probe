/**
 * Interface for a tcp socket.
 */

// The data types used by TcpSocket
declare module freedom.TcpSocket {
  export interface DisconnectInfo {
    errcode :number;
    message :string;
  }

  export interface ReadInfo {
    data :ArrayBuffer;
  }

  export interface WriteInfo {
    bytesWritten :number;
  }

  export interface SocketInfo {
    connected :boolean;
    localPort :number;
    peerAddress :string;
    peerPort :number;
    localAddress :string;
  }
}  // module Sockets

// The TcpSocket class (freedom['core.TcpSocket'])
declare module freedom {
  export interface TcpSocket {
    listen(address:string, port:number) : Promise<void>;
    connect(hostname :string, port :number) : Promise<void>;
    write(data :ArrayBuffer) : Promise<freedom.TcpSocket.WriteInfo>;
    getInfo() : Promise<freedom.TcpSocket.SocketInfo>;
    close() : Promise<void>;
    on(type: string, callback: Function) : void;
  }
}
