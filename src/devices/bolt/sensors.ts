
import { Bolt } from './bolt';
import { Receiver } from './receiver';
import { ICommand, IEvent, ISensorData } from './interfaces';
import { wait } from './utils';
import { Canvas } from '../../components/canvas';
export class Sensors {

	private bolt:     Bolt;
	private receiver: Receiver;

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.receiver = this.bolt.receiver;
		this.activate();
	}

	activate() {

		this.receiver.on('compass', async (event: IEvent) => {
			console.log(this.bolt.name, 'onCompassNotify.setheading', event);
			const heading = event.sensordata;
			await this.bolt.actuators.rotate(-heading);
			await this.bolt.actuators.resetYaw();
			this.bolt.heading = heading;
		});

		this.receiver.on('willsleep', (event: IEvent) => {
			console.log(this.bolt.name, 'onWillSleepAsync', 'keepAwake', this.bolt.status.keepAwake, event.msg);
			if (this.bolt.status.keepAwake) {
				this.bolt.actuators.wake();
				(async () => {
					await this.bolt.actuators.setHeading(this.bolt.heading - 180);
					await wait(1000);
					await this.bolt.actuators.setHeading(this.bolt.heading);
				})();
			}
		});

		this.receiver.on('sleep',       (event: IEvent) => console.log(this.bolt.name, 'sleep',       event.msg));
		this.receiver.on('charging',    (event: IEvent) => console.log(this.bolt.name, 'charging',    event.msg));
		this.receiver.on('notcharging', (event: IEvent) => console.log(this.bolt.name, 'notcharging', event.msg));

		this.receiver.on('collison',    (event: IEvent) => {
			console.log(this.bolt.name, 'onCollision.data', event.msg.data.join(' '));
		});
		

		this.receiver.on('sensordata', (event: IEvent) => {

			const data: ISensorData = event.sensordata;

			function precise(x: number) {
				return Number.parseFloat(String(x)).toPrecision(3);
			}

			this.bolt.status.position.x = data.locator.positionX;
			this.bolt.status.position.y = data.locator.positionY;
			this.bolt.status.velocity.x = data.locator.velocityX;
			this.bolt.status.velocity.y = data.locator.velocityY;

			Canvas.render();

			const loc = data.locator;
			const  plog = {
				px: precise(loc.positionX),
				py: precise(loc.positionY),
				vx: precise(loc.velocityX),
				vy: precise(loc.velocityY),
			}
			console.log(this.bolt.name, 'onSensorUpdate', loc.positionX, loc.positionY);

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