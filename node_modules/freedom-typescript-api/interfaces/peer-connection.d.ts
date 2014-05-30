// TODO: Make these actually typed, and probably shove into freedom.

// Reference:
// https://github.com/UWNetworksLab/freedom/blob/master/interface/core.js

declare module freedom.PeerConnection {

}

declare module freedom {
  class PeerConnection {
    on:(event:string,f:any)=>void;
    setup:(channelId:string, peerName:string, stunServers:string[])=>void;
    close:any;
    send:any;

    openDataChannel:(channelLabel:string, callback?:any)=>any;
    closeDataChannel:(channelLabel:string)=>void;
  }
}
