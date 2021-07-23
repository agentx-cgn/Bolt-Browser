
import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { Bluetooth as BT }  from '../bluetooth.service';
import { Bolt } from './bolt';

class bolts {

  public map;
  public find;
  private bolts: any = [];
  private callback: any;
  private bluetooth: any;

  constructor ( BT: any ) {
    this.bluetooth = BT;
    this.map  = Array.prototype.map.bind(this.bolts);
    this.find = Array.prototype.find.bind(this.bolts);
    this.findBolts();
	}

  async findBolts () {
    const devices = await this.bluetooth.find('SB-');
    for ( let device of devices ){			  
      await this.initBolt(device);
      await this.initBolt(device);
    }
    m.redraw();
  }

  public async pairBolt () {
    const device  = await this.bluetooth.pair('SB-');
    await this.initBolt(device);
    m.redraw();
  }

  private async initBolt(device: BluetoothDevice) {

    const bolt    = new Bolt(device);
    const success = await this.initServices(bolt, device);

    if (success) {
      device.addEventListener('gattserverdisconnected', bolt.onGattServerDisconnected.bind(bolt));
      // device.addEventListener('advertisementreceived',  bolt.onAdvertisementreceived.bind(bolt));
      device.addEventListener('advertisementreceived',  (event) => console.log('advertisementreceived', event));
      await bolt.awake();
      this.bolts.push(bolt);
    }

  }

  public async disconnect (bolt?:Bolt) {

    console.log('Disconnecting...', bolt.name);

    if (bolt.device.gatt.connected) {
      await bolt.device.gatt.disconnect();
      this.remove(bolt);

    } else {
      console.log(bolt.name, 'is already disconnected');

    }

    m.redraw();

  }

  private remove (bolt:Bolt) {
    const index = this.bolts.indexOf(bolt);
    if (index > -1) {
      this.bolts.splice(index, 1);
    }
  }

	async initServices(bolt: Bolt, device: BluetoothDevice): Promise<boolean> {

    try {

      const server: BluetoothRemoteGATTServer      = await device.gatt.connect();
      const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices();

      for ( let service of services ){

        if (service.uuid === C.UUID_SPHERO_SERVICE) {
          console.log('UUID_SPHERO_SERVICE');
          let characteristics: BluetoothRemoteGATTCharacteristic[] = await service.getCharacteristics();
          for ( let charac of characteristics){
            if ( charac.uuid === C.APIV2_CHARACTERISTIC ){
              await this.mapCharacteristic(bolt, charac);
            }
          }

        } else if (service.uuid === C.UUID_SPHERO_SERVICE_INITIALIZE) {
          console.log('UUID_SPHERO_SERVICE_INITIALIZE');
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
      console.log('Bolts.initServices', device.name, err);
      return false;
    
	  }

	}

	async mapCharacteristic(bolt: Bolt, charac: BluetoothRemoteGATTCharacteristic){

    if (charac.properties.notify){
      await charac.startNotifications();
    }

		bolt.characs.set(charac.uuid, charac);
    // charac.addEventListener('characteristicvaluechanged', bolt.onCharacteristicValueChanged.bind(bolt));
    charac.addEventListener('characteristicvaluechanged', bolt.sensors.getCharacteristicValueParser());

  }


}

export const Bolts = new bolts(BT);