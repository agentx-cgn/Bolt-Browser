/// <reference types="web-bluetooth" />

// import { 
//   UUID_SPHERO_SERVICE,
//   UUID_SPHERO_SERVICE_INITIALIZE,
//   APIV2_CHARACTERISTIC,
//   ANTIDOS_CHARACTERISTIC,
//   DFU_CONTROL_CHARACTERISTIC,
//   DFU_INFO_CHARACTERISTIC,
//   SUBS_CHARACTERISTIC,
// } from '../globals/constants';

import { CONSTANTS as C } from '../globals/constants';

class bluetooth {

	public devices: BluetoothDevice[] = [];

	constructor () {

		window.addEventListener("unload", (event) => { 
			this.devices.forEach( device => {
				console.log('Disconnecting...', device.name);
				if (device.gatt.connected) {
					device.gatt.disconnect();
				} else {
					console.log(device.name, 'is already disconnected');
				}
			})
			this.devices = [];
			console.log(' - - - BYE - - - ', '\n');

		});
		document.addEventListener('visibilitychange', function logData() {
			if (document.visibilityState === 'hidden') {
				// console.log("visibilityState === 'hidden'");
			}
		});

		this.find('SB-');

	}

	isAvailable () {
		return !!navigator.bluetooth;
	}

	async find (namePrefix:string) {

		return navigator.bluetooth.getDevices()
			.then( (devices:BluetoothDevice[]) => {
				return devices.filter( device => device.name.startsWith(namePrefix) );
			})
			.catch(error => {
				console.log('Argh! ' + error);
			})
		;

	}

	async pair (namePrefix:string) {

		return navigator.bluetooth
			.requestDevice({
				filters: [{
					namePrefix: namePrefix,				
					services: [C.UUID_SPHERO_SERVICE],
				}],
				optionalServices : [C.UUID_SPHERO_SERVICE_INITIALIZE],
			})
			.then( devices => {
				this.devices.push(devices);
				return devices;
			})

		// console.log('connect.devices', devices);

		// const server = await devices.gatt.connect();
		// const services = await server.getPrimaryServices();

		// console.log('BT.Device', devices);
		// console.log('GATT.Server', server);
		// console.log('GATT.Server.services', services);

		// return devices;

	}

	// async initDevice(device: BluetoothDevice) {

	// 	const server   = await device.gatt.connect();
	// 	const services = await server.getPrimaryServices();

	// 	for ( let service of services ){			
	// 		if (service.uuid === C.UUID_SPHERO_SERVICE){
	// 			let characteristics = await service.getCharacteristics();
	// 			for ( let charac of characteristics){
	// 				if ( charac.uuid === C.APIV2_CHARACTERISTIC ){
	// 					await this.mapCharacteristic(charac);
	// 				}
	// 			}
	// 		}
	// 		else if (service.uuid === C.UUID_SPHERO_SERVICE_INITIALIZE){
	// 			let characteristics = await service.getCharacteristics();
	// 			for (let charac of characteristics){
	// 				if (charac.uuid === C.ANTIDOS_CHARACTERISTIC || 
	// 				charac.uuid === C.DFU_CONTROL_CHARACTERISTIC || 
	// 				charac.uuid === C.DFU_INFO_CHARACTERISTIC || 
	// 				charac.uuid === C.SUBS_CHARACTERISTIC){
	// 					await this.mapCharacteristic(charac);
	// 				}
	// 			}
	// 		}
	// 	}

	// }

	// async mapCharacteristic(charac:any){

  //   if (charac.properties.notify){
  //     await charac.startNotifications();
  //   }
	// 	this.characs.set(charac.uuid, charac);
  //   charac.addEventListener('characteristicvaluechanged', this.onDataChange);

  // }

	// onDataChange ( ...args:any ) {
	// 	console.log('onDataChange', args)
	// }



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
					services: [C.UUID_SPHERO_SERVICE],
				}],
				optionalServices : [C.UUID_SPHERO_SERVICE_INITIALIZE],
			})
			const server = await this.device.gatt.connect();
			const services = await server.getPrimaryServices();

      console.log('BT.Device', this.device);
      console.log('GATT.Server', server);
      console.log('GATT.Server.services', services);
			
			for ( let service of services ){			
				if (service.uuid === C.UUID_SPHERO_SERVICE){
					let characteristics = await service.getCharacteristics();
					for ( let charac of characteristics){
						if ( charac.uuid === C.APIV2_CHARACTERISTIC ){
							await this.mapCharacteristic(charac);
						}
					}
				}
				else if (service.uuid === C.UUID_SPHERO_SERVICE_INITIALIZE){
					let characteristics = await service.getCharacteristics();
					for (let charac of characteristics){
						if (charac.uuid === C.ANTIDOS_CHARACTERISTIC || 
						charac.uuid === C.DFU_CONTROL_CHARACTERISTIC || 
						charac.uuid === C.DFU_INFO_CHARACTERISTIC || 
						charac.uuid === C.SUBS_CHARACTERISTIC){
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

export const Bluetooth = new bluetooth();

// export {
// 	Bluetooth: new Bluetooth(),
// }
