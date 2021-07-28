
import { Bolt } from './bolt';

export interface IUuid {
  uuid:    string,
}


export interface IEvent {
  msg?:        any,
  sensordata?: any
}

export interface ISensorData {
  length: number,
  accelerometer: {
    x: number,
    y: number,
    z: number,
  },
  angles: {
    pitch: number,
    roll:  number,
    yaw:   number,
  },
  gyro: {
    pitch: number,
    roll:  number,
    yaw:   number,
  },
  locator: {
    positionX: number,
    positionY: number,
    velocityX: number,
    velocityY: number,
  }
}

export interface IAction {
  id?:      number,     
  name:    string,
  bolt:    Bolt,
  command: number[],
  charac:  BluetoothRemoteGATTCharacteristic,
  acknowledged: boolean,
  executed: boolean,
  onSuccess: any,
  onError:  any,
}

export interface ICmdMessage {
  name:    string,
  device : number,
  command: number,
  data:    any[], 
  target?: number
}

export interface IFlags {
  
}
export interface ICommand {
  packet: number[], // = [...packet];
  startOfPacket: number, //  = packet.shift();
  flags: any, // = decodeFlags(packet.shift());         ////////////

  // if (flags.hasTargetId){
    targetId?: number, // = packet.shift();
  // }	

  // if (flags.hasSourceId){
    sourceId?: number,  //= packet.shift();
  // }

  deviceId: number, // = packet.shift();
  commandId: number, // = packet.shift();
  seqNumber: number // = packet.shift();

  data: number[], //;

  // let dataLen = packet.length-2;
  // for ( let i = 0 ; i < dataLen ; i++){
  //   data.push(packet.shift());
  // }

  checksum: number, // = packet.shift();
  endOfPacket: number, // = packet.shift();
}