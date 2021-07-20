

import { CONSTANTS as C } from '../../globals/constants';
import { commandPushByte } from './utils';
import { Queue } from './queue';
import { Bolt } from './bolt';
import { ICmdMessage } from './interfaces';
import { decodeFlags, maskToRaw } from './utils';

let counter: number = 0;

export class Sensors {

  private queue: Queue;
  private heading: number;
  private bolt: Bolt;

  constructor (bolt: Bolt) {
    this.bolt  = bolt;
    this.queue = bolt.queue;
  }

  onCharacteristicValueChanged ( event: any ) {

    let i, packet: any[], sum: number, escaped;

    function init () {
      packet = [];
      sum = 0;
      escaped = false;
    }

		// this.init = function (){
    //   this.packet = [];
    //   this.sum = 0;
    //   this.escaped = false;
    //   }
  
    let len = event.target.value.byteLength;
      
    for ( i=0; i<len; i++ ) {

      let value = event.target.value.getUint8(i);

        switch (value){

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
            escaped=true;
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
  configureCollisionDetection( xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01){
    let commandInfo = {
      name:      'configureCollisionDetection',
      deviceId:  C.DeviceId.sensor,
      commandId: C.Cmds.sensor.configureCollision, // SensorCommandIds.configureCollision,
      targetId:  0x12,
      data:      [ method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime ]
    }
    let command = this.createCommand(commandInfo);
    this.queueCommand(command);

  }

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
	sensorMask(rawValue, interval){
		let commandInfo = {
			deviceId: DeviceId.sensor,
			commandId: SensorCommandIds.sensorMask,
			targetId: 0x12,
			data: [ (interval >> 8) & 0xff,
					interval & 0xff,
					0,	
					(rawValue >> 24) & 0xff,
					(rawValue >> 16) & 0xff,
					(rawValue >> 8) & 0xff,
					rawValue & 0xff,
				],
			}
		let command = this.createCommand(commandInfo);
		this.queueCommand(command);
	}
	/* Sends sensors mask to Sphero (gyroscope) */
	sensorMaskExtended(rawValue){
		let commandInfo = { 
			deviceId: DeviceId.sensor,
			commandId: SensorCommandIds.sensorMaskExtented,
			targetId: 0x12,
			data: [ (rawValue >> 24) & 0xff,
					(rawValue >> 16) & 0xff,
					(rawValue >> 8) & 0xff,
					rawValue & 0xff,
				],
			}
		let command = this.createCommand(commandInfo);
		this.queueCommand(command);
	}


	/* If the packet is a notification , calls the right handler, else print the command status*/
	readCommand(command: any){
		if ( command.seqNumber === 255){
			if ( command.deviceId === DeviceId.powerInfo && command.commandId === PowerCommandIds.batteryStateChange){
				switch(command.data[0]){
					case BatteryState.charging:
						this.handleCharging(command);
						break;
					case BatteryState.notCharging:
						this.handleNotCharging(command);
						break;
					case BatteryState.charged:
						this.handleCharged(command)
						break;
					default:
						console.log('Unknown battery state');
				}
			}
			else if (command.deviceId === DeviceId.powerInfo && command.commandId === PowerCommandIds.willSleepAsync){
            	this.handleWillSleepAsync(command);
        	}
        	else if (command.deviceId === DeviceId.powerInfo && command.commandId === PowerCommandIds.sleepAsync ){
            	this.handleSleepAsync(command);
        	}
        	else if (command.deviceId === DeviceId.sensor && command.commandId === SensorCommandIds.collisionDetectedAsync) {
            	this.handleCollision(command);
        	}
        	else if (command.deviceId === DeviceId.sensor && command.commandId === SensorCommandIds.sensorResponse){
        		this.handleSensorUpdate(command);
        	}
        	else if (command.deviceId === DeviceId.sensor && command.commandId === SensorCommandIds.compassNotify){
        		this.handleCompassNotify(command);
        	}
			else{
				console.log('UNKNOWN EVENT '+ command.packet);
			}
		}
		else{
			this.printCommandStatus(command);	
		}
	}

	on(eventName, handler){
		this.eventListeners[eventName] = handler;
	}

	/*-------------------------------------------------------------------------------
									EVENT HANDLERS 
	-------------------------------------------------------------------------------*/
	handleCollision(command){
		let handler = this.eventListeners['onCollision'];
		if (handler){
			handler(command);
		}
		else{
			console.log('Event detected: onCollision, no handler for this event');
		}
	}

	handleCompassNotify(command){
		let handler = this.eventListeners['onCompassNotify'];
		if (handler){
			 let angle = command.data[0] << 8;
		     angle += command.data[1];
			handler(angle);
		}
		else{
			console.log('Event detected: onCompassNotify, no handler for this event');
		}
	}
	handleWillSleepAsync(command){
		let handler = this.eventListeners['onWillSleepAsync'];
		if (handler){
			handler(command);
		}
		else{
			console.log('Event detected: onWillSleepAsync, no handler for this event');
		}
	}

	handleSleepAsync(command){
		let handler = this.eventListeners['onSleepAsync'];
		if (handler){
			handler(command);
		}
		else{
			console.log('Event detected: onSleepAsync, no handler for this event');
		}
	}

	handleCharging(command){
		let handler = this.eventListeners['onCharging'];
		if (handler){
			handler(command);
		}
		else{
			console.log('Event detected: onCharging, no handler for this event');
		}
	}

	handleNotCharging(command){
		let handler = this.eventListeners['onNotCharging'];
		if (handler){
			handler(command);
		}
		else{
			console.log('Event detected: onNotCharging, no handler for this event');
		}
	}

	handleCharged(command){
		let handler = this.eventListeners['onCharged'];
		if (handler){
			handler(command);
		}
		else{
			console.log('Event detected: onCharged, no handler for this event');
		}
	}

	handleSensorUpdate(command){
		let handler = this.eventListeners['onSensorUpdate'];
		if(handler){
			const parsedResponse = parseSensorResponse(command.data, this.rawMask);
			handler(parsedResponse);
		}
		else{
			console.log('Event detected: onSensorUpdate, no handler for this event');
		}
	}

	//-------------------------------------------------------------------------------

	/* Prints the status of a command */
	printCommandStatus(command){
		switch(command.data[0]){
			case ApiErrors.success:
				//console.log('Command succefully executed!');
				break;
			case ApiErrors.badDeviceId:
				console.log('Error: Bad device id');
				break;
			case ApiErrors.badCommandId:
				console.log('Error: Bad command id');
				break;
			case ApiErrors.notYetImplemented:
				console.log('Error: Bad device id');
				break; 
			case ApiErrors.commandIsRestricted:
				console.log('Error: Command is restricted');
				break;
			case ApiErrors.badDataLength:
				console.log('Error: Bad data length');
				break;
			case ApiErrors.commandFailed:
				console.log('Error: Command failed');
				break;
			case ApiErrors.badParameterValue:
				console.log('Error: Bad paramater value');
				break;
			case ApiErrors.busy:
				console.log('Error: Busy');
				break;
			case ApiErrors.badTargetId:
				console.log('Error: Bad target id');
				break;
			case ApiErrors.targetUnavailable:
				console.log('Error: Target unavailable');
				break;
			default:
				console.log('Error: Unknown error');
		}
	}



}; 

