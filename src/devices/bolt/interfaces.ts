
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
  id:           number,     
  name:         string,
  bolt:         Bolt,
  command:      number[],
  charac:       BluetoothRemoteGATTCharacteristic,
  acknowledged: boolean,
  executed:     boolean,
  onSuccess:    any,
  onError:      any,
}

export interface ICmdMessage {
  name:         string,
  device:       number,
  command:      number,
  data:         any[], 
  target?:      number,
}

export interface IFlags {
  
}
export interface ICommand {
  targetId?:      number,
  sourceId?:      number, 
  packet:         number[],
  startOfPacket:  number,
  flags:          any,
  deviceId:       number, 
  commandId:      number, 
  seqNumber:      number,
  data:           number[],
  checksum:       number,
  endOfPacket:    number,
}
