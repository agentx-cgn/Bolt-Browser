
import { Bolt } from './bolt';

export interface IUuid {
  uuid:    string,
}
export interface IAction {
  id?:      number,     
  name:    string,
  bolt:    Bolt,
  command: number[],
  charac:  BluetoothRemoteGATTCharacteristic, 
}
export interface ICmdMessage {
  name:    string,
  device : number,
  command: number,
  data:    any[], 
  target?: number
}
