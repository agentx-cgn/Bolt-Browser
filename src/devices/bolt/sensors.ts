

import { CONSTANTS as C } from '../constants';
import { Queue } from './queue';
import { Bolt } from './bolt';
import { ICmdMessage } from './interfaces';
import { decodeFlags, maskToRaw, parseSensorResponse,flatSensorMask, wait } from './utils';

let counter: number = 0;

export class Sensors {

  private queue: Queue;
  public heading: number;
  private bolt: Bolt;
  private listeners: any = [];
  private rawMask: any;

  constructor (bolt: Bolt) {
    this.bolt  = bolt;
    this.queue = bolt.queue;
    this.activate();
  }

  activate () {

    this.on('onCompassNotify',   (angle: number) => {
      console.log(this.bolt.name, 'onCompassNotify',  angle);
      this.heading = angle;
    });
    
    this.on('onWillSleepAsync',  (...args: any) => {
      console.log(this.bolt.name, 'onWillSleepAsync', args);
      this.bolt.actuators.wake();
      (async () => {
        await this.bolt.actuators.setHeading(this.heading -180);
        await wait(1000);
        await this.bolt.actuators.setHeading(this.heading );
      })();
    } );
    this.on('onSleepAsync',    (...args: any) => console.log(this.bolt.name, 'onSleepAsync',     args) );
    this.on('onCharging',      (...args: any) => console.log(this.bolt.name, 'onCharging',     args) );
    this.on('onNotCharging',   (...args: any) => console.log(this.bolt.name, 'onNotCharging',     args) );

  }

	/* Put a command message on the queue */
	queueMessage( message: ICmdMessage ){
		this.queue.append({
      name:    message.name,
      bolt:    this.bolt,
      command: this.bolt.createCommand(message),
      charac:  this.bolt.characs.get(C.APIV2_CHARACTERISTIC), 
    });
	}

  getCharacteristicValueParser () {

    let self = this, i, packet: any[], sum: number, escaped: boolean;

    function init () {
      packet  = [];
      sum     = 0;
      escaped = false;
    }

    return function onCharacteristicValueChanged ( event:any ) {

      let len = event.target.value.byteLength;

      for ( i=0; i<len; i++ ) {

        let value = event.target.value.getUint8(i);
  
        switch (value) {

          case C.APIConstants.startOfPacket:
            if (packet === undefined || packet.length != 0 ) { init(); }
            packet.push(value);
          break;

          case C.APIConstants.endOfPacket:
            sum -= packet[packet.length - 1];
            if (packet.length < 6 ) {
              console.log('Packet is too small');
              init();
              break; 
            }
            if ( packet[packet.length - 1] !== (~(sum) & 0xff )) {
              console.log('Bad checksum');
              init();
              break;
            }
            packet.push(value);
            this.decode(packet);
            init();
          break;
          
          case C.APIConstants.escape:
            escaped = true;
          break;
          
          case C.APIConstants.escapedEscape:
          case C.APIConstants.escapedStartOfPacket:
          case C.APIConstants.escapedEndOfPacket:
            if ( escaped ) {
                value   = value | C.APIConstants.escapeMask;
                escaped = false;
            }	
            packet.push(value);
            sum += value;
          break;
            
          default: 
            if ( escaped ){ console.log('No escaped char...'); }
            else {
              packet.push(value);
              sum += value;
            }
        }

      }

    }.bind(self);

  }
  
  /* Packet decoder */
	decode(packet: any) {

		let command = {} as any;

		command.packet = [...packet];
		command.startOfPacket = packet.shift();
		command.flags = decodeFlags(packet.shift());

		if (command.flags.hasTargetId){
			command.targetId = packet.shift();
		}	

		if (command.flags.hasSourceId){
			command.sourceId = packet.shift();
		}

		command.deviceId = packet.shift();
		command.commandId = packet.shift();
		command.seqNumber = packet.shift();

		command.data = [];

		let dataLen = packet.length-2;
		for ( let i = 0 ; i < dataLen ; i++){
			command.data.push(packet.shift());
		}

		command.checksum = packet.shift();
		command.endOfPacket = packet.shift();

		this.readCommand(command);

	}

  /* Enables collision detection */
  configureCollisionDetection( xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
    this.queueMessage({
      name:     'configureCollisionDetection',
      device:   C.DeviceId.sensor,
      command:  C.Cmds.sensor.configureCollision, // SensorCommandIds.configureCollision,
      target:   0x12,
      data:     [ method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime ]
    });

  }

	/* Enables sensor data streaming */
	configureSensorStream () {

		var mask = [
      C.SensorMaskValues.accelerometer,
      C.SensorMaskValues.orientation,
      C.SensorMaskValues.locator,
      C.SensorMaskValues.gyro,
		];

		let interval = 100; 

		this.rawMask = maskToRaw(mask); 
		this.sensorMask(flatSensorMask(this.rawMask.aol), interval); 
		this.sensorMaskExtended(flatSensorMask(this.rawMask.gyro));

	}

	/* Sends sensors mask to Sphero (acceleremoter, orientation and locator) */
	sensorMask(rawValue: number, interval: number){
		this.queueMessage({
      name:    'sensorMask',
			device:  C.DeviceId.sensor,
			command: C.Cmds.sensor.sensorMask, // SensorCommandIds.sensorMask,
			target:  0x12,
			data:      [ (
        interval >> 8) & 0xff, 
				interval & 0xff,
				0,	
				(rawValue >> 24) & 0xff,
				(rawValue >> 16) & 0xff,
				(rawValue >> 8)  & 0xff,
				rawValue & 0xff,
			],
		});
	}
	/* Sends sensors mask to Sphero (gyroscope) */
	sensorMaskExtended(rawValue: any){
		this.queueMessage({ 
      name:     'sensorMaskExtended',
			device:   C.DeviceId.sensor,
			command:  C.Cmds.sensor.sensorMaskExtented, // SensorCommandIds.sensorMaskExtented,
			target:   0x12,
			data: [ 
        (rawValue >> 24) & 0xff,
				(rawValue >> 16) & 0xff,
				(rawValue >>  8) & 0xff,
				 rawValue & 0xff,
			],
		});
	}

	/* If the packet is a notification , calls the right handler, else print the command status*/
	readCommand(command: any){

		if ( command.seqNumber === 255){
			if ( command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.power.batteryStateChange){ // PowerCommandIds.batteryStateChange){
				switch(command.data[0]){
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
			
      }	else if (command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.power.willSleepAsync){ // PowerCommandIds.willSleepAsync){
        this.handleWillSleepAsync(command);
      } else if (command.deviceId === C.DeviceId.powerInfo && command.commandId === C.Cmds.power.sleepAsync) { // PowerCommandIds.sleepAsync ){
        this.handleSleepAsync(command);
      } else if (command.deviceId === C.DeviceId.sensor && command.commandId === C.Cmds.sensor.collisionDetectedAsync){ // SensorCommandIds.collisionDetectedAsync) {
       	this.handleCollision(command);
     	}	else if (command.deviceId === C.DeviceId.sensor && command.commandId === C.Cmds.sensor.sensorResponse) { // SensorCommandIds.sensorResponse){
        this.handleSensorUpdate(command);
    	}	else if (command.deviceId === C.DeviceId.sensor && command.commandId === C.Cmds.sensor.compassNotify) { // SensorCommandIds.compassNotify){
       	this.handleCompassNotify(command);
      } else {
				console.log('UNKNOWN EVENT '+ command.packet);
			}

		} else {
			this.printCommandStatus(command);	

		}

	}

	on(eventName: any, handler: any){
		this.listeners[eventName] = handler;
	}

	/*-------------------------------------------------------------------------------
									EVENT HANDLERS 
	-------------------------------------------------------------------------------*/
	handleCollision(command: any){
		let handler = this.listeners['onCollision'];
		if (handler){
			handler(command);
		}	else {
			console.log('Event detected: onCollision, no handler for this event');
		}
	}

	handleCompassNotify(command: any){
		let handler = this.listeners['onCompassNotify'];
		if (handler){
      let angle = command.data[0] << 8;
      angle += command.data[1];
			handler(angle);
		
    }	else {
			console.log('Event detected: onCompassNotify, no handler for this event');
		}
	}
	handleWillSleepAsync(command: any){
		let handler = this.listeners['onWillSleepAsync'];
		if (handler){
			handler(command);
		}	else {
			console.log('Event detected: onWillSleepAsync, no handler for this event');
		}
	}

	handleSleepAsync(command: any){
		let handler = this.listeners['onSleepAsync'];
		if (handler){
			handler(command);
		}	else {
			console.log('Event detected: onSleepAsync, no handler for this event');
		}
	}

	handleCharging(command: any){
		let handler = this.listeners['onCharging'];
		if (handler){
			handler(command);
		} else {
			console.log('Event detected: onCharging, no handler for this event');
		}
	}

	handleNotCharging(command: any){
		let handler = this.listeners['onNotCharging'];
		if (handler){
			handler(command);
		}	else {
			console.log('Event detected: onNotCharging, no handler for this event');
		}
	}

	handleCharged(command: any){
		let handler = this.listeners['onCharged'];
		if (handler){
			handler(command);
		}	else {
			console.log('Event detected: onCharged, no handler for this event');
		}
	}

	handleSensorUpdate(command: any){
		let handler = this.listeners['onSensorUpdate'];
		if(handler){
			const parsedResponse = parseSensorResponse(command.data, this.rawMask);
			handler(parsedResponse);
		}	else {
			console.log('Event detected: onSensorUpdate, no handler for this event');
		}
	}

	//-------------------------------------------------------------------------------

	/* Prints the status of a command */
	printCommandStatus(command: any){
		switch(command.data[0]){
			case C.Errors.success:
				console.log(this.bolt.name, 'Success', command.seqNumber, command.data, command.flags);
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
