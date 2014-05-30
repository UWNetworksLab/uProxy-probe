/**
 * Interface for a UDP socket.
 */

declare module freedom.UdpSocket {
  // Type for the chrome.socket.getInfo callback:
  //   https://developer.chrome.com/apps/sockets_udp#type-SocketInfo
  // This is also the type returned by getInfo().
  export interface SocketInfo {
    // Note that there are other fields but these are the ones we care about.
    localAddress:string;
    localPort:number;
  }

  // Type for the chrome.socket.recvFrom callback:
  //   http://developer.chrome.com/apps/socket#method-recvFrom
  // This is also the type returned to onData callbacks.
  export interface RecvFromInfo {
    resultCode:number;
    address:string;
    port:number;
    data:ArrayBuffer;
  }

  export interface Implementation {
    bind(address:string, port:number, continuation:(result:number) => void) : void;
    sendTo(data:ArrayBuffer, address:string, port:number,
            continuation:(bytesWritten:number) => void) : void;
    destroy(continuation:() => void) : void;
    getInfo(continuation:(socketInfo:SocketInfo) => void) : void;
  }
}

declare module freedom {
  class UdpSocket {
    bind:any;
    sendTo:any;
    destroy:any;
    on:any;
    getInfo:any;
  }
}
