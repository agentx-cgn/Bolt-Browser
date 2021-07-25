

import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';
import { ICommand, ISensorData } from './interfaces';
import { decodeFlags, maskToRaw, parseSensorResponse, flatSensorMask, wait } from './utils';

import { Canvas } from '../../components/canvas';

export class Sensors {

	private bolt: Bolt;
	private listeners: any = [];

	public log: ISensorData[] = [];

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.activate();
	}

	activate() {

		this.on('onCompassNotify', (heading: number) => {
			console.log(this.bolt.name, 'onCompassNotify.set heading', heading);
			this.bolt.heading = heading;
		});

		this.on('onWillSleepAsync', (...args: any) => {
			console.log(this.bolt.name, 'onWillSleepAsync', 'keepAwake', this.bolt.status.keepAwake, args);
			if (this.bolt.status.keepAwake) {
				this.bolt.actuators.wake();
				(async () => {
					await this.bolt.actuators.setHeading(this.bolt.heading - 180);
					await wait(1000);
					await this.bolt.actuators.setHeading(this.bolt.heading);
				})();
			}
		});

		this.on('onSleepAsync',  (...args: any) => console.log(this.bolt.name, 'onSleepAsync',  args));
		this.on('onCharging',    (...args: any) => console.log(this.bolt.name, 'onCharging',    args));
		this.on('onNotCharging', (...args: any) => console.log(this.bolt.name, 'onNotCharging', args));

		this.on('onCollision',   (cmd: ICommand) => {
			console.log(this.bolt.name, 'onCollision.data', cmd.data.join(' '));
		});
		

		this.on('onSensorUpdate', (data: ISensorData) => {

			function precise(x: number) {
				return Number.parseFloat(String(x)).toPrecision(3);
			}

			this.log.push(data);

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

	getCharacteristicValueParser() {

		let self = this, i, packet: any[], sum: number, escaped: boolean;

		const decodePacket       = this.decodePacket.bind(this);
		const interpreteCommand  = this.interpreteCommand.bind(this);

		function init() {
			packet = [];
			sum = 0;
			escaped = false;
		}

		return function onCharacteristicValueChanged(event: any) {

			let len = event.target.value.byteLength;

			for (i = 0; i < len; i++) {

				let value = event.target.value.getUint8(i);

				switch (value) {

					case C.APIConstants.startOfPacket:
						if (packet === undefined || packet.length != 0) { init(); }
						packet.push(value);
						break;

					case C.APIConstants.endOfPacket:
						sum -= packet[packet.length - 1];
						if (packet.length < 6) {
							console.log('Packet is too small');
							init();
							break;
						}
						if (packet[packet.length - 1] !== (~(sum) & 0xff)) {
							console.log('Bad checksum');
							init();
							break;
						}
						packet.push(value);

						const command = decodePacket(packet);
						interpreteCommand(command);
						init();

					break;

					case C.APIConstants.escape:
						escaped = true;
						break;

					case C.APIConstants.escapedEscape:
					case C.APIConstants.escapedStartOfPacket:
					case C.APIConstants.escapedEndOfPacket:
						if (escaped) {
							value = value | C.APIConstants.escapeMask;
							escaped = false;
						}
						packet.push(value);
						sum += value;
						break;

					default:
						if (escaped) { console.log('No escaped char...'); }
						else {
							packet.push(value);
							sum += value;
						}
				}

			}

		}.bind(self);

	}

	/* Incoming Packet decoder */
	decodePacket(packet: any) {

		let command = {} as ICommand;

		command.packet = [...packet];
		command.startOfPacket = packet.shift();
		command.flags = decodeFlags(packet.shift());

		if (command.flags.hasTargetId) {
			command.targetId = packet.shift();
		}

		if (command.flags.hasSourceId) {
			command.sourceId = packet.shift();
		}

		command.deviceId = packet.shift();
		command.commandId = packet.shift();
		command.seqNumber = packet.shift();

		command.data = [];

		let dataLen = packet.length - 2;
		for (let i = 0; i < dataLen; i++) {
			command.data.push(packet.shift());
		}

		command.checksum = packet.shift();
		command.endOfPacket = packet.shift();

		// this.interpreteCommand(command);
		return command;

	}




	/* If the packet is a notification , calls the right handler, else print the command status*/
	interpreteCommand(command: ICommand) {

		if (command.seqNumber === 255) {
			this.handleNotification(command)

		} else {
			this.bolt.queue.notify(command);
			this.printCommandStatus(command);

		}

	}
	
	

/*-------------------------------------------------------------------------------
								EVENT HANDLERS 
-------------------------------------------------------------------------------*/

	handleNotification (command: ICommand) {

		if (command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.power.batteryStateChange) { // PowerCommandIds.batteryStateChange){
			switch (command.data[0]) {
				case C.BatteryState.charging:
					this.handleCharging(command);
					break;
				case C.BatteryState.notCharging:
					this.handleNotCharging(command);
					break;
				case C.BatteryState.charged:
					this.handleCharged(command)
					break;
				default:
					console.log('Unknown battery state');
			}

		} else if (command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.power.willSleepAsync) { // PowerCommandIds.willSleepAsync){
			this.handleWillSleepAsync(command);
		} else if (command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.power.sleepAsync) { // PowerCommandIds.sleepAsync ){
			this.handleSleepAsync(command);

		} else if (command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.sensor.configureCollision) { 
			console.log('EVENT', 'powerInfo', 'configureCollision', command.data);

		} else if (command.deviceId === C.DeviceId.sensor && command.commandId === C.Cmds.sensor.collisionDetectedAsync) { // SensorCommandIds.collisionDetectedAsync) {
			this.handleCollision(command);
		} else if (command.deviceId === C.DeviceId.sensor && command.commandId === C.Cmds.sensor.sensorResponse) { // SensorCommandIds.sensorResponse){
			this.handleSensorUpdate(command);
		} else if (command.deviceId === C.DeviceId.sensor && command.commandId === C.Cmds.sensor.compassNotify) { // SensorCommandIds.compassNotify){
			this.handleCompassNotify(command);

		} else {
			console.log('handleNotification', 'UNKNOWN EVENT ', command);
			console.log('handleNotification', 'UNKNOWN EVENT ', command.packet);
			this.printCommandStatus(command)

			// after wake :   UNKNOWN EVENT 141, 40,  1, 19, 17, 255, 179, 216
			// put in cradle  UNKNOWN EVENT 141, 56, 17,  1, 19,  28, 255,   1, 134, 216]


		}

	}

	on(eventName: any, handler: any) {
		this.listeners[eventName] = handler;
	}

	handleCollision(command: any) {
		let handler = this.listeners['onCollision'];
		if (handler) {
			handler(command);
		} else {
			console.log('Event detected: onCollision, no handler for this event');
		}
	}

	handleCompassNotify(command: any) {
		let handler = this.listeners['onCompassNotify'];
		if (handler) {
			let angle = command.data[0] << 8;
			angle += command.data[1];
			handler(angle);

		} else {
			console.log('Event detected: onCompassNotify, no handler for this event');
		}
	}

	handleWillSleepAsync(command: any) {
		let handler = this.listeners['onWillSleepAsync'];
		if (handler) {
			handler(command);
		} else {
			console.log('Event detected: onWillSleepAsync, no handler for this event');
		}
	}

	handleSleepAsync(command: any) {
		let handler = this.listeners['onSleepAsync'];
		if (handler) {
			handler(command);
		} else {
			console.log('Event detected: onSleepAsync, no handler for this event');
		}
	}

	handleCharging(command: any) {
		let handler = this.listeners['onCharging'];
		if (handler) {
			handler(command);
		} else {
			console.log('Event detected: onCharging, no handler for this event');
		}
	}

	handleNotCharging(command: any) {
		let handler = this.listeners['onNotCharging'];
		if (handler) {
			handler(command);
		} else {
			console.log('Event detected: onNotCharging, no handler for this event');
		}
	}

	handleCharged(command: any) {
		let handler = this.listeners['onCharged'];
		if (handler) {
			handler(command);
		} else {
			console.log('Event detected: onCharged, no handler for this event');
		}
	}

	handleSensorUpdate(command: any) {
		let handler = this.listeners['onSensorUpdate'];
		if (handler) {
			const parsedResponse = parseSensorResponse(command.data, this.bolt.status.rawMask);
			handler(parsedResponse);
		} else {
			console.log('Event detected: onSensorUpdate, no handler for this event');
		}
	}



/*-------------------------------------------------------------------------------
								DEBUG 
-------------------------------------------------------------------------------*/

	/* Prints the status of a command */
	printCommandStatus(command: any) {
		switch (command.data[0]) {
			case C.Errors.success:
				// console.log(this.bolt.name, 'Success', command.seqNumber, command.data, command.flags);
				break;
			case C.Errors.badDeviceId:
				console.log('Error: Bad device id');
				break;
			case C.Errors.badCommandId:
				console.log('Error: Bad command id');
				break;
			case C.Errors.notYetImplemented:
				console.log('Error: Bad device id');
				break;
			case C.Errors.commandIsRestricted:
				console.log('Error: Command is restricted');
				break;
			case C.Errors.badDataLength:
				console.log('Error: Bad data length');
				break;
			case C.Errors.commandFailed:
				console.log('Error: Command failed');
				break;
			case C.Errors.badParameterValue:
				console.log('Error: Bad paramater value');
				break;
			case C.Errors.busy:
				console.log('Error: Busy');
				break;
			case C.Errors.badTargetId:
				console.log('Error: Bad target id');
				break;
			case C.Errors.targetUnavailable:
				console.log('Error: Target unavailable');
				break;
			default:
				console.log('Error: Unknown error');
		}
	}

};
