
import { Bolt } from './bolt';
import { Receiver } from './receiver';
import { ICommand, IEvent, ISensorData } from './interfaces';
import { wait } from './utils';
import { Plotter } from '../../components/plotter';
export class Sensors {

	private bolt:     Bolt;
	private receiver: Receiver;

	constructor (bolt: Bolt) {
		this.bolt     = bolt;
		this.receiver = this.bolt.receiver;
		this.activate();
	}

	activate() {

	// 	* An 8-bit value is returned for each infrared sensor, assigned by mask.
	// 	Mask description on BOLT: 32'h0000_00ff: front left sensor 32'h0000_ff00: front right sensor 32'h00ff_0000: back right sensor 32'hff00_0000: back left sensor
	// 	* @returns Promise that resolves with the response from RVR for given command
	// 	*/
	//  getBotToBotInfraredReadings(): Promise<string | never>;
	//  /**

		this.receiver.on('sensordata', (event: IEvent) => {

			const data: ISensorData = event.sensordata;

			function precise(x: number) {
				return Number.parseFloat(String(x)).toPrecision(3);
			}

			this.bolt.status.position.x = data.locator.positionX;
			this.bolt.status.position.y = data.locator.positionY;
			this.bolt.status.velocity.x = data.locator.velocityX;
			this.bolt.status.velocity.y = data.locator.velocityY;

			Plotter.render();

			const loc = data.locator;
			const  plog = {
				px: precise(loc.positionX),
				py: precise(loc.positionY),
				vx: precise(loc.velocityX),
				vy: precise(loc.velocityY),
			}
			// console.log(this.bolt.name, 'onSensorUpdate', loc.positionX, loc.positionY);

		});

	}







/*-------------------------------------------------------------------------------
								EVENT HANDLERS
-------------------------------------------------------------------------------*/



	// on(eventName: any, handler: any) {
	// 	this.listeners[eventName] = handler;
	// }

	// handleCollision(command: any) {
	// 	let handler = this.listeners['onCollision'];
	// 	if (handler) {
	// 		handler(command);
	// 	} else {
	// 		console.log('Event detected: onCollision, no handler for this event');
	// 	}
	// }

	// handleCompassNotify(command: any) {
	// 	let handler = this.listeners['onCompassNotify'];
	// 	if (handler) {
	// 		let angle = command.data[0] << 8;
	// 		angle += command.data[1];
	// 		handler(angle);

	// 	} else {
	// 		console.log('Event detected: onCompassNotify, no handler for this event');
	// 	}
	// }

	// handleWillSleepAsync(command: any) {
	// 	let handler = this.listeners['onWillSleepAsync'];
	// 	if (handler) {
	// 		handler(command);
	// 	} else {
	// 		console.log('Event detected: onWillSleepAsync, no handler for this event');
	// 	}
	// }

	// handleSleepAsync(command: any) {
	// 	let handler = this.listeners['onSleepAsync'];
	// 	if (handler) {
	// 		handler(command);
	// 	} else {
	// 		console.log('Event detected: onSleepAsync, no handler for this event');
	// 	}
	// }

	// handleCharging(command: any) {
	// 	let handler = this.listeners['onCharging'];
	// 	if (handler) {
	// 		handler(command);
	// 	} else {
	// 		console.log('Event detected: onCharging, no handler for this event');
	// 	}
	// }

	// handleNotCharging(command: any) {
	// 	let handler = this.listeners['onNotCharging'];
	// 	if (handler) {
	// 		handler(command);
	// 	} else {
	// 		console.log('Event detected: onNotCharging, no handler for this event');
	// 	}
	// }

	// handleCharged(command: any) {
	// 	let handler = this.listeners['onCharged'];
	// 	if (handler) {
	// 		handler(command);
	// 	} else {
	// 		console.log('Event detected: onCharged, no handler for this event');
	// 	}
	// }

	// handleSensorUpdate(command: any) {
	// 	let handler = this.listeners['onSensorUpdate'];
	// 	if (handler) {
	// 		const parsedResponse = parseSensorResponse(command.data, this.bolt.status.rawMask);
	// 		handler(parsedResponse);
	// 	} else {
	// 		console.log('Event detected: onSensorUpdate, no handler for this event');
	// 	}
	// }




};
