/// <reference types="web-bluetooth" />

import { CONSTANTS as C } from './constants';

class bluetooth {

	public devices: BluetoothDevice[] = [];

	constructor () {

		// window.addEventListener("unload", (event) => { 
		// 	this.devices.forEach( device => {
		// 		console.log('Disconnecting...', device.name);
		// 		if (device.gatt.connected) {
		// 			device.gatt.disconnect();
		// 		} else {
		// 			console.log(device.name, 'is already disconnected');
		// 		}
		// 	})
		// 	this.devices = [];
		// 	console.log(' - - - BYE - - - ', '\n');

		// });

		document.addEventListener('visibilitychange', function logData() {
			if (document.visibilityState === 'hidden') {
				// console.log("visibilityState === 'hidden'");
			}
		});

		if ('onavailabilitychanged' in navigator.bluetooth) {
			navigator.bluetooth.addEventListener('availabilitychanged', function(event: any) {
				console.log(`> Bluetooth is ${event.value ? 'available' : 'unavailable'}`);
			});
		}

		if (navigator.bluetooth.getDevices) {
			this.find('SB-');
		}

	}

	public async isAvailable () {
		return navigator.bluetooth.getAvailability()
			.then(availability => availability)
		;
	}

	private async find (namePrefix:string) {

		return navigator.bluetooth.getDevices()
			.then( (devices:BluetoothDevice[]) => {
				return devices.filter( device => device.name.startsWith(namePrefix) );
			})
			.catch(error => {
				console.log('Argh! ' + error);
			})
		;

	}

	public async pair (namePrefix:string) {

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
		}

};

export const Bluetooth = new bluetooth();
