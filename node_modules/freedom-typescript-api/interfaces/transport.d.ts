/**
 * For a description of each method and event, see
 * freedom/interface/transport.js in the Freedom source.
 */

/// <reference path='promise.d.ts' />

declare module freedom.Transport {
  // onData events.
  export interface IncomingMessage {
    tag:string;
    data:ArrayBuffer;
  }
}

declare module freedom {
  export interface Transport {
    // TODO(yangoon): define a type for signalling channels (proxy)
    setup(name:string, proxy:any) : Promise<void>;
    send(tag:string, data:ArrayBuffer) : Promise<void>;
    close() : Promise<void>;

    on(eventType:string, f:Function) : void;
    on(eventType:'onData', f:(message:Transport.IncomingMessage) => void) : void;
    on(eventType:'onClose', f:() => void) : void;
  }
}
