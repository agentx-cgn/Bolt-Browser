/// <reference types="web-bluetooth" />

import { 
  UUID_SPHERO_SERVICE,
  UUID_SPHERO_SERVICE_INITIALIZE,
  APIV2_CHARACTERISTIC,
  ANTIDOS_CHARACTERISTIC,
  DFU_CONTROL_CHARACTERISTIC,
  DFU_INFO_CHARACTERISTIC,
  SUBS_CHARACTERISTIC,
} from '../../globals/constants';

export class Bluetooth {

	public devices: BluetoothDevice[] = [];

	constructor () {

		navigator.bluetooth.getDevices()
			.then((devices:BluetoothDevice[]) => {
				this.devices = devices;
				console.log('> Got ' + devices.length + ' Bluetooth devices.');
				for (const device of devices) {
					console.log('  > ' + device.name + ' (' + device.id + ')');
				}
			})
			.catch(error => {
				console.log('Argh! ' + error);
			})
		;

	}

	isAvailable () {
		return !!navigator.bluetooth;
	}

	async autopair (namePrefix:string) {

		return navigator.bluetooth.getDevices()
			.then((devices:BluetoothDevice[]) => {
				this.devices = devices;
				console.log('> Got ' + devices.length + ' Bluetooth devices.');
				for (const device of devices) {
					console.log('  > ' + device.name + ' (' + device.id + ')');
				}
			})
			.catch(error => {
				console.log('Argh! ' + error);
			})
		;


	}

	async pair (namePrefix:string) {

		const devices = await navigator.bluetooth.requestDevice({
			filters: [{
				namePrefix: namePrefix,				
				services: [UUID_SPHERO_SERVICE],
			}],
			optionalServices : [UUID_SPHERO_SERVICE_INITIALIZE],
		})

		console.log('connect.devices', devices);

		const server = await devices.gatt.connect();
		const services = await server.getPrimaryServices();

		console.log('BT.Device', devices);
		console.log('GATT.Server', server);
		console.log('GATT.Server.services', services);

		return devices;

	}

};

const BluetoothX = {

  async disconnect(){
		if (this.connected){
			await this.device.gatt.disconnect();
			this.connected = false
			this.device = null;
		}
		else{
			throw "Device is not connected"
		}
	},

  async mapCharacteristic(charac:any){
    if (charac.properties.notify){
      await charac.startNotifications();
    }
       this.characs.set(charac.uuid, charac);
    charac.addEventListener('characteristicvaluechanged', this.onDataChange);
  },

  async connect() {
		try{
			this.device = await navigator.bluetooth.requestDevice({
				filters: [{
					namePrefix: 'SB-',				
					services: [UUID_SPHERO_SERVICE],
				}],
				optionalServices : [UUID_SPHERO_SERVICE_INITIALIZE],
			})
			const server = await this.device.gatt.connect();
			const services = await server.getPrimaryServices();

      console.log('BT.Device', this.device);
      console.log('GATT.Server', server);
      console.log('GATT.Server.services', services);
			
			for ( let service of services ){			
				if (service.uuid === UUID_SPHERO_SERVICE){
					let characteristics = await service.getCharacteristics();
					for ( let charac of characteristics){
						if ( charac.uuid === APIV2_CHARACTERISTIC ){
							await this.mapCharacteristic(charac);
						}
					}
				}
				else if (service.uuid === UUID_SPHERO_SERVICE_INITIALIZE){
					let characteristics = await service.getCharacteristics();
					for (let charac of characteristics){
						if (charac.uuid === ANTIDOS_CHARACTERISTIC || 
						charac.uuid === DFU_CONTROL_CHARACTERISTIC || 
						charac.uuid === DFU_INFO_CHARACTERISTIC || 
						charac.uuid === SUBS_CHARACTERISTIC){
							await this.mapCharacteristic(charac);
						}
					}
				}
			}
			console.log('Connected !')
			await this.init();
		}
		catch(error){
			console.log(error.message);
		}
	}

}

// export {
// 	Bluetooth: new Bluetooth(),
// }
