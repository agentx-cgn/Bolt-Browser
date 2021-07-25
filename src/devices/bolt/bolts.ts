/// <reference types="web-bluetooth" />

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

    window.addEventListener("unload", (event) => { 

			this.bolts.forEach( (bolt: Bolt) => {

				console.log(bolt.name, bolt.device.gatt.connected ? 'Disconnecting...' : 'not connected');

				if (bolt.device.gatt.connected) {
          bolt.device.gatt.disconnect();
          // bolt.actuators.sleep();
				}
			})

			console.log(' - - - BYE - - - ', '\n');

		});
	}

  async findBolts () {

    return navigator.bluetooth.getDevices()
      .then( (devices: BluetoothDevice[] ) => devices.filter( device => device.name.startsWith('SB-') ) )
      .then( (devices: BluetoothDevice[] ) => {

        const promises = [];

        for (const device of devices) {

          let connecting = false;
          const listener = async (event: any) => { // BluetoothAdvertisingEvent
            if (!connecting){
              connecting = true;
              console.log('advertisementreceived', 'connecting...', event)
              await this.connectBolt(device);
              m.redraw();

            } else {
              console.log(device.name, 'advertisementreceived', {rssi: event.rssi, txPower: event.txPower})

            }
          }

          device.addEventListener('advertisementreceived',  listener);

          promises.push(
            device.watchAdvertisements()
              .then( what => {
                // console.log('watchAdvertisements 0', what)
                // return this.connectBolt(device);
              })
              .catch( err => console.log('watchAdvertisements.error', err))
          );
        }

        return Promise.all(promises);

      })
      .then( what => {
        // console.log('watchAdvertisements 1', what)
      })
      .catch(error => {
        console.log('Argh! ' + error);
      })
    ;
  }

    // const devices: BluetoothDevice[] = await this.bluetooth.find('SB-');

    // for (const device of devices) {
    //   const listener = (event: any) => {
    //     console.log('advertisementreceived', event)
    //     device.removeEventListener('advertisementreceived', listener);
    //     this.connectBolt(device);
    //     m.redraw();
    //   }
    //   device.addEventListener('advertisementreceived',  listener);
    //   await device.watchAdvertisements()
    //     .then( what => console.log('watchAdvertisements', what))
    //     .catch( err => console.log('watchAdvertisements.error', err))
    //   ;
    // }



  public async pairBolt () {

    return this.bluetooth
      .pair('SB-')
      .then( (device: BluetoothDevice) => {
        return this.connectBolt(device);
      })
      .catch((err:any) => {
        console.log('Bolts.pairBolt', err);
      })
      .finally(m.redraw)
    ;

    // const device  = await this.bluetooth.pair('SB-');
    // await this.connectBolt(device);
    // m.redraw();

  }

  private async connectBolt(device: BluetoothDevice) {

    const bolt    = new Bolt(device);
    const success = await this.connectGATT(bolt, device);

    if (success) {
      device.addEventListener('gattserverdisconnected', bolt.onGattServerDisconnected.bind(bolt));
      // device.addEventListener('advertisementreceived',  bolt.onAdvertisementReceived.bind(bolt));
      device.addEventListener('advertisementreceived',  (event) => console.log('connectBolt.advertisementreceived', event));
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

	async connectGATT(bolt: Bolt, device: BluetoothDevice): Promise<boolean> {

    try {

      const server: BluetoothRemoteGATTServer      = await device.gatt.connect();
      const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices();

      console.log(device.name, 'watchingAdvertisements?', device.watchingAdvertisements);

      for ( let service of services ){

        if (service.uuid === C.UUID_SPHERO_SERVICE) {
          // console.log('UUID_SPHERO_SERVICE');
          let characteristics: BluetoothRemoteGATTCharacteristic[] = await service.getCharacteristics();
          for ( let charac of characteristics){
            if ( charac.uuid === C.APIV2_CHARACTERISTIC ){
              await this.mapCharacteristic(bolt, charac);
            }
          }

        } else if (service.uuid === C.UUID_SPHERO_SERVICE_INITIALIZE) {
          // console.log('UUID_SPHERO_SERVICE_INITIALIZE');
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
      console.log('Bolts.connectGATT', device.name, err);
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