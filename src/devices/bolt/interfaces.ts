
import { Bolt } from './bolt';
import { Bolts } from './bolts';

// export interface BluetoothAdvertisementEvent extends Event {
//   device: BluetoothDevice;
//   rssi: number;
//   txPower: number;
//   manufacturerData?: BluetoothManufacturerData | undefined;
//   serviceData?: BluetoothServiceData | undefined;
//   uuids?: BluetoothServiceUUID[] | undefined;
// }

declare global {
  interface Window {
      Bolts: typeof Bolts;
  }
}


export type TColor = [number, number, number];
export type TNum   = number[];
export interface IUuid {
  uuid:    string,
}

export interface IMatrix {
  rotation: number,
  image:    number[][],
}

export interface IStatus {
  rssi:          number,
  txPower:       number,
  keepAwake:     boolean,
  heading:       number,
  stabilization: number,
  rawMask:       any, // {aol, gyro}
  position:      any,
  ambient:       number[],
  velocity:      any,
  voltage:       number[],
  percentage:    number[],
  matrix:        IMatrix,
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
  responseData?: number[],
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

export interface IPoint {
  x: number,
  y: number,
}
