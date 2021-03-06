
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
export type TBatteryState = 0|1|2|3;
export type TOnOff        = 0|1;


export type TUuid = { uuid: string };

export interface IConfigColors {
  console:   string, // CSS Colors
  plot:      string,
  log:       string,
  backcolor: string,
  matrix:    TColor, // Bots Color on matrix
  black:     TColor,
  front:     TColor,
  back:      TColor,
}
export interface IMagic {
  rollInterval: number,
  sensorInterval: number,
}
export interface IConfig {
  colors: IConfigColors,
  magic:  IMagic,
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
  ambient:       number[],
  sensors:       any,
  angles:        any,
  position:      any,
  speed:         number,
  velocity:      any,
  voltage:       number,
  battery:       number,
  charger:       number,
  matrix:        IMatrix,
  infrared:      any,
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
  payload:      number[],
  device:       number,
  target:       number,
  command:      number,
  bytes:        Uint8Array,
  charac:       BluetoothRemoteGATTCharacteristic,
  acknowledged: boolean,
  written:      boolean,
  success:      boolean,
  onSuccess:    any,
  onError:      any,
  response?:    number[],
}

export interface IMsgAction {
  name:         string,
  device:       number,
  command:      number,
  target?:      number,
  data:         any[],
}

export interface IFlags {

}
export interface IMessage {
  id:             number,
  device:         number,
  command:        number,
  source?:        number,
  target?:        number,
  packet:         number[],
  startOfPacket:  number,
  flags:          any,
  payload:        number[],
  checksum:       number,
  endOfPacket:    number,
}

export interface IPoint {
  x: number,
  y: number,
}
