
import m from "mithril";

import { CONSTANTS as C }  from '../../globals/constants';
import { Bluetooth as BT }  from '../../services/bluetooth.service';
import { Bolt } from './bolt';

class bolts {

  public map;
  private bolts: any = [];
  private callback: any;
  private bluetooth: any;

  constructor ( BT: any ) {
    this.bluetooth = BT;
    this.map = Array.prototype.map.bind(this.bolts);
    this.initialize();
	}

  onUpdate ( callback: any ) {
    this.callback = callback;
  }

  async initialize () {

    const devices = await this.bluetooth.find('SB-');

    for ( let device of devices ){			  

      const bolt = new Bolt(device);
      const success = await this.initDevice(bolt, device);

      if (success) {
        device.addEventListener('gattserverdisconnected', bolt.onGattServerDisconnected.bind(bolt));
        await bolt.awake();
        this.bolts.push(bolt);
        m.redraw();
        console.log('Bolts.initialized', device.name);
      }

    }

  }

  async pair () {

    const device  = await this.bluetooth.pair('SB-');
    const bolt    = new Bolt(device);
    const success = await this.initDevice(bolt, device);

    if (success) {
      device.addEventListener('gattserverdisconnected', bolt.onGattServerDisconnected.bind(bolt));
      await bolt.awake();
      this.bolts.push(bolt);
      m.redraw();
    }

  }

  remove (bolt:Bolt) {
    const index = this.bolts.indexOf(bolt);
    if (index > -1) {
      this.bolts.splice(index, 1);
    }
  }

  async disconnect (bolt?:Bolt) {
    console.log('Disconnecting...', bolt.name);
    if (bolt.device.gatt.connected) {
      await bolt.device.gatt.disconnect();
      this.remove(bolt);
    } else {
      console.log(bolt.name, 'is already disconnected');
    }
    m.redraw();

  }


	async initDevice(bolt: Bolt, device: BluetoothDevice): Promise<boolean> {

    try {

      const server: BluetoothRemoteGATTServer      = await device.gatt.connect();
      const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices();

      for ( let service of services ){

        if (service.uuid === C.UUID_SPHERO_SERVICE) {
          let characteristics: BluetoothRemoteGATTCharacteristic[] = await service.getCharacteristics();
          for ( let charac of characteristics){
            if ( charac.uuid === C.APIV2_CHARACTERISTIC ){
              await this.mapCharacteristic(bolt, charac);
            }
          }

        } else if (service.uuid === C.UUID_SPHERO_SERVICE_INITIALIZE) {
          let characteristics = await service.getCharacteristics();
          for (let charac of characteristics) {
            if (charac.uuid === C.ANTIDOS_CHARACTERISTIC     || 
                charac.uuid === C.DFU_CONTROL_CHARACTERISTIC || 
                charac.uuid === C.DFU_INFO_CHARACTERISTIC    || 
                charac.uuid === C.SUBS_CHARACTERISTIC
            ){
              await this.mapCharacteristic(bolt, charac);
            }
          }

        }

      }

      return true;

    } catch (err) {
      console.log('Bolts.initDevice', device.name, err);
      return false;
    
	  }

	}

	async mapCharacteristic(bolt: Bolt, charac: BluetoothRemoteGATTCharacteristic){

    if (charac.properties.notify){
      await charac.startNotifications();
    }

		bolt.characs.set(charac.uuid, charac);
    charac.addEventListener('characteristicvaluechanged', bolt.onCharacteristicValueChanged.bind(bolt));
    // charac.addEventListener('characteristicvaluechanged', bolt.sensors.getCharacteristicValueParser());

  }

}

// export class Bolt { 

//   public name:any;
//   public characs = new Map();
//   public device:any;

//   private connected:boolean;
//   private actuators;

//   constructor (device: BluetoothDevice) {
//     this.name      = device.name;
//     this.device    = device;
//     this.actuators = new Actuators(this);
// 	}

//   append () {}

//   async awake(){
//     const color = Math.round(0xffffff * Math.random());
//     const r = color >> 16, g = color >> 8 & 255, b = color & 255;

// 		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
// 		this.connected = true;
// 		this.actuators.wake();	
// 		// this.resetYaw();
// 		this.actuators.resetLocator();	
//     this.actuators.setLedsColor(2, 4, 2);
// 		this.actuators.setMatrixColor(r, g, b);
// 		this.actuators.calibrateToNorth();
// 		this.actuators.printChar('K', 10, 40, 10);
// 	};

//   onCharacteristicValueChanged (event: any) {

//     const tgt = event.currentTarget;
//     const mesg = {
//       uuid: tgt.uuid,
//       value: JSON.stringify(tgt.value),
//     }
//     // console.log(this.name, 'onCharacteristicValueChanged', mesg);
//   }

//   onGattServerDisconnected (event: any) {

//     const tgt = event.currentTarget;
//     const mesg = {
//       uuid: tgt.uuid,
//       value: JSON.stringify(tgt.value),
//     }
//     console.log(this.name, 'onGattServerDisconnected', tgt.name);
//   }

  

// }

export const Bolts = new bolts(BT);