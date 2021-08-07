/// <reference types="web-bluetooth" />

import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { Bolt } from './bolt';
class bolts {

  public map;
  public find;
  public forEach;

  private configs = {
    'SB-9129' : { colors: { console: '#FF0', plot: 'green', backcolor: '#5ec19d', matrix: [30, 240, 30] } },
    'SB-2B96' : { colors: { console: '#F0F', plot: 'blue',  backcolor: '#5895d4', matrix: [30, 30, 240] } },
  } as any;

  private bolts: any = [];

  constructor ( ) {


    // this.bluetooth = BT;
    this.map     = Array.prototype.map.bind(this.bolts);
    this.find    = Array.prototype.find.bind(this.bolts);
    this.forEach = Array.prototype.forEach.bind(this.bolts);

    // allows: await Bolts.get('SB-9129').actuators.roll(0, 90) in console
    window.Bolts = this;
    // this.get = (name: string) => this.find( (bolt: Bolt) => bolt.name === name);

	}

  public get (name: string) { return this.find( (bolt: Bolt) => bolt.name === name); }

  public async isAvailable (): Promise<boolean> {
    return navigator.bluetooth.getAvailability()
      .then(availability => availability)
    ;
  }

  activate () {

    if ('onavailabilitychanged' in navigator.bluetooth) {
			navigator.bluetooth.addEventListener('availabilitychanged', function (event: any) {
				console.log(`> Bluetooth is ${event.value ? 'available' : 'unavailable'}`);
			});
		}

    window.addEventListener("unload",  async () => {
      for (const bolt of this.bolts) {
        if (bolt.device.gatt.connected) {
          await bolt.actuators.sleep();
          console.log('Bolts.unload', bolt.name, 'sleeping');
          // Don't disconnect here !!
				}
			}
		});

    this.searchBolts();

  }

  private remove (bolt:Bolt) {
    const index = this.bolts.indexOf(bolt);
    if (index > -1) {
      this.bolts.splice(index, 1);
    }
  }

  private async searchBolts () {

    return navigator.bluetooth.getDevices()
      .then( (devices: BluetoothDevice[] ) => devices.filter( device => device.name.startsWith('SB-') ) )
      .then( (devices: BluetoothDevice[] ) => { console.log('Bolts.searching...', devices.map( d => d.name)); return devices; })
      .then( (devices: BluetoothDevice[] ) => {

        const promises = [];

        for (const device of devices) {

          let connecting = false;

          const advertisementListener = async (event: BluetoothAdvertisementEvent) => {
            if (!connecting){

              console.log(device.name, 'connecting...')
              connecting = true;
              const bolt = new Bolt(device, this.configs[device.name]);
              this.bolts.push(bolt);
              await this.connectBolt(bolt, device);
              m.redraw();

            } else {
              const bolt: Bolt = this.find( (bolt: Bolt) => bolt.name === device.name );
              if (bolt) {
                bolt.status.rssi    = event.rssi;
                bolt.status.txPower = event.txPower;
              }
              m.redraw();
              // console.log(device.name, 'advertisementreceived', {rssi: event.rssi, txPower: event.txPower});

            }
          }

          device.addEventListener('advertisementreceived',  advertisementListener);

          promises.push (
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
        m.redraw();
        // console.log('watchAdvertisements 1', what)
      })
      .catch(error => {
        console.log('Argh! ' + error);
      })
    ;
  }

  public async pairBolt () {

    return navigator.bluetooth
      .requestDevice({
        filters: [{
          namePrefix: 'SB-',
          services: [C.UUID_SPHERO_SERVICE],
        }],
        optionalServices : [C.UUID_SPHERO_SERVICE_INITIALIZE],
      })
      // .then( (device: BluetoothDevice) => {
      //   this.devices.push(device);
      //   return device;
      // })
      .then( (device: BluetoothDevice) => {
        const bolt = new Bolt(device, this.configs[device.name]);
        this.bolts.push(bolt);
        this.connectBolt(bolt, device)
      } )
      .catch( ( err: any ) => {
        // DOMException: User cancelled the requestDevice() chooser.
        // console.log('Bolts.pairBolt', err);
      })
      .finally(m.redraw)
    ;

  }

  private async connectBolt(bolt: Bolt, device: BluetoothDevice) {

    const success = await this.connectGATT(bolt, device);
    const onGattServerDisconnected = bolt.receiver.onGattServerDisconnected.bind(bolt.receiver);
    const onAdvertisementReceived  = bolt.receiver.onAdvertisementReceived.bind(bolt.receiver);

    if (success) {
      device.addEventListener('gattserverdisconnected', onGattServerDisconnected);
      device.addEventListener('advertisementreceived',  onAdvertisementReceived);
      await bolt.reset();
      await bolt.activate();
    }

  }

  public disconnectall () {
    this.forEach(this.disconnect.bind(this));
  }

  // doesnt work Z:150 Cannot read propelayrty 'gatt' of undefined
  public async disconnect ( bolt?:Bolt ) {

    console.log(bolt.name, 'Disconnecting ...', );

    if (bolt.device.gatt.connected) {
      bolt.device.gatt.disconnect();
      this.remove(bolt);

    } else {
      console.log(bolt.name, 'is already disconnected');

    }

    m.redraw();

  }


	async connectGATT(bolt: Bolt, device: BluetoothDevice): Promise<boolean> {

    try {

      const server: BluetoothRemoteGATTServer      = await device.gatt.connect();
      const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices();

      // console.log(device.name, 'watchingAdvertisements?', device.watchingAdvertisements);

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

    const characteristicvaluechanged = bolt.receiver.getCharacteristicValueParser();

		bolt.characs.set(charac.uuid, charac);
    charac.addEventListener('characteristicvaluechanged', characteristicvaluechanged);

  }

}

export const Bolts = new bolts();
