/// <reference types="web-bluetooth" />

import m from "mithril";

import { CONSTANTS as C }  from './constants';
import { Bolt } from './bolt';
import { Logger } from '../../components/logger/logger';
import { Scripter } from './scripter';
import { IConfig } from './interfaces';

class bolts {

  public map;
  public find;
  public forEach;

  public hasBluetooth: boolean;

  private bolts = [] as Bolt[];
  private scripter: Scripter;

  private configs: { [key: string]: IConfig } = {

    'SB-FAKE' : {
      magic:  { rollInterval: 1000, sensorInterval: 400,},
      colors: {
        console: '#FF0', plot: 'brown', backcolor: '#bfbf85', log: '#bfbf8544',
        front: [10, 0, 0], back: [ 5, 5, 5], black: [0, 0, 0], matrix: [30, 240, 30]
      },
    } as IConfig,

    'SB-9129' : {
      magic:  { rollInterval: 1000, sensorInterval: 400,},
      colors: {
        console: '#FF0', plot: 'green', backcolor: '#5ec19d', log: '#5ec19d44',
        front: [10, 0, 0], back: [ 5, 5, 5], black: [0, 0, 0], matrix: [30, 240, 30]
      },
    } as IConfig,

    'SB-2B96' : {
      magic:  { rollInterval: 1000, sensorInterval: 400,},
      colors: {
        console: '#F0F', plot: 'blue',  backcolor: '#5895d4', log: '#5895d444',
        front: [10, 0, 0], back: [ 5, 5, 5], black: [0, 0, 0], matrix: [30, 30, 240]
       }
    },

  };

  fakeBolt () {
    const noop = () => {};
    return {
      name: 'SB-FAKE',
      config: this.configs['SB-FAKE'],
      status: {
        rssi: 0,
        txPower: 0,
      },
      queue: [] as any,
      connected: true,
      actuators: new Proxy({}, { get (w: any, l: string ) { return noop} }),
      reset: noop,
      calibrate: noop,
      action: noop,
      stress: noop,

    } as Bolt;

  }


  constructor ( ) {

    // if debug, no bolts though
    // this.bolts = [this.fakeBolt()];

    this.map     = Array.prototype.map.bind(this.bolts);
    this.find    = Array.prototype.find.bind(this.bolts);
    this.forEach = Array.prototype.forEach.bind(this.bolts);

    this.scripter = new Scripter(this);

    // allows: await Bolts.get('SB-9129').actuators.roll(0, 90) in console
    window.Bolts = this;

    this.autoaction();

	}

  async wait (time: number) {
    return new Promise(callback => setTimeout(callback, time));
  };

  async autoaction () {

    // return await this.execute
    //   .step1(500)
    //   .step2(1000)
    //   .step2(1000)
    //   .step3(2000)
    //   .end
    // ;

  }
  get execute () { return this.scripter.execute(); }

  public count () {return this.bolts.length;}
  public get (name: string) { return this.find( (bolt: Bolt) => bolt.name === name); }

  public async isBlueToothAvailable (): Promise<boolean> {
    return navigator.bluetooth.getAvailability()
      .then(availability => {
        this.hasBluetooth = availability;
        m.redraw();
        return availability;
      })
    ;
  }

  activate () {

    // if ('onavailabilitychanged' in navigator.bluetooth) {
			navigator.bluetooth.addEventListener('availabilitychanged', (event: any) => {
        this.hasBluetooth = !!event.value;
        m.redraw();
				console.log(`> Bluetooth is ${event.value ? 'available' : 'unavailable'}`);
			});
		// }

    window.addEventListener("unload",  async () => {
      for (const bolt of this.bolts) {
        if (bolt.device.gatt.connected) {
          await bolt.actuators.sleep();
          console.log('Bolts.unload', bolt.name, 'sleeping');
          // Don't disconnect here !!
				}
			}
		});

  }

  private remove (bolt:Bolt) {
    const index = this.bolts.indexOf(bolt);
    if (index > -1) {
      this.bolts.splice(index, 1);
    }
  }

  getAdvertisementListener (device: BluetoothDevice) {

    let connecting = false;

    return async (event: BluetoothAdvertisementEvent) => {

      if (!connecting) {

        console.log(device.name, 'connecting...')
        connecting = true;
        const bolt = new Bolt(device, this.configs[device.name]);
        this.bolts.push(bolt);
        await this.connectBolt(bolt, device);

      } else {
        const bolt: Bolt = this.find( (bolt: Bolt) => bolt.name === device.name );
        if (bolt) {
          bolt.status.rssi    = event.rssi;
          // Math.min(Math.max(2 * (txPower + 100), 0), 100)
          bolt.status.txPower = event.txPower;
        }
        // console.log(device.name, 'advertisementreceived', {rssi: event.rssi, txPower: event.txPower});

      }

      m.redraw();

    };

  }

  public async searchBolts () {

    // return navigator.bluetooth.getAvailability()
    return this.isBlueToothAvailable()
      .then( (availability: boolean) => availability ? navigator.bluetooth.getDevices() : Promise.reject())
      .then( (devices: BluetoothDevice[] ) => devices.filter( device => device.name.startsWith('SB-') ) )
      .then( (devices: BluetoothDevice[] ) => { console.log('Bolts.searching...', devices.map( d => d.name)); return devices; })
      .then( (devices: BluetoothDevice[] ) => {

        const promises = [];

        for (const device of devices) {

          const advertisementListener = this.getAdvertisementListener(device);

          device.addEventListener('advertisementreceived',  advertisementListener);

          promises.push (
            device.watchAdvertisements()
              .then( what => {
                // console.log('watchAdvertisements 0', what)
                // return this.connectBolt(device);
              })
              .catch( err => {
                this.hasBluetooth = false;
                console.log('watchAdvertisements.error', err)
              })
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
        const bolt = new Bolt(device, this.configs[device.name] as IConfig);
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
      Logger.info(bolt, 'connected');
      await bolt.reset();
      await bolt.activate();
      await bolt.autoaction();
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

    const characteristicvaluechanged = bolt.receiver.getCharacteristicValueParser(charac.uuid);

		bolt.characs.set(charac.uuid, charac);
    charac.addEventListener('characteristicvaluechanged', characteristicvaluechanged);

  }

}

export const Bolts = new bolts();
