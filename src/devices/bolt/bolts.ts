
import { CONSTANTS as C }  from '../../globals/constants';
import { Bluetooth as BT }  from '../../services/bluetooth.service';
import { Actuators } from './actuators';
import m from "mithril";


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
        await bolt.awake();
        this.bolts.push(bolt);
        m.redraw();
      }

    }

    console.log('Bolts.initialize', devices);

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

  async disconnect (bolt?:Bolt) {
    console.log('Disconnecting...', bolt.name);
    if (bolt.device.gatt.connected) {
      bolt.device.gatt.disconnect();
    } else {
      console.log(bolt.name, 'is already disconnected');
    }

  }


	async initDevice(bolt: Bolt, device: BluetoothDevice): Promise<boolean> {

    try {

      const server   = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      for ( let service of services ){

        if (service.uuid === C.UUID_SPHERO_SERVICE) {
          let characteristics = await service.getCharacteristics();
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
      console.log(device.name, err);
      return false;
    
	  }

	}

	async mapCharacteristic(bolt: Bolt, charac:any){

    if (charac.properties.notify){
      await charac.startNotifications();
    }

		bolt.characs.set(charac.uuid, charac);
    charac.addEventListener('characteristicvaluechanged', bolt.onCharacteristicValueChanged.bind(bolt));

  }

}



/* The objective of this queue is to send packets in turns to avoid GATT error */



export class Bolt { 

  public name:any;
  public characs = new Map();
  public device:any;

  private connected:boolean;
  private actuators;

  constructor (device: BluetoothDevice) {
    this.name      = device.name;
    this.device    = device;
    this.actuators = new Actuators(this);
	}

  append () {}

  async awake(){
		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
		this.connected = true;
		this.actuators.wake();	
		// this.resetYaw();
		this.actuators.resetLocator();	
    this.actuators.setLedsColor(5, 5, 10);
		this.actuators.setMatrixColor(64, 128, 64);
	};

  onCharacteristicValueChanged (event: any) {

    const tgt = event.currentTarget;
    const mesg = {
      uuid: tgt.uuid,
      value: JSON.stringify(tgt.value),
    }
    // console.log(this.name, 'onCharacteristicValueChanged', mesg);
  }

  onGattServerDisconnected (event: any) {

    const tgt = event.currentTarget;
    const mesg = {
      uuid: tgt.uuid,
      value: JSON.stringify(tgt.value),
    }
    console.log(this.name, 'onGattServerDisconnected', tgt.name);
  }

  

}

export const Bolts = new bolts(BT);