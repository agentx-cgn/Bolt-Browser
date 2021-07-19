

import { CONSTANTS as C } from '../../globals/constants';
import { commandPushByte } from './utils';
import { Queue } from './queue';
import { Bolt } from './bolts';

export class Actuators {

  private seqNumber = 0;
  private queue;
  private bolt;

  constructor (bolt: Bolt) {
    this.bolt = bolt;
    this.queue  = new Queue();
  }

  /* Packet encoder */
	createCommand( message: any ) {

		const { name, deviceId, commandId, targetId, data } = message;
	  
    this.seqNumber = (this.seqNumber + 1) % 255;
    var sum = 0;
    var command = [];
    command.push(C.APIConstants.startOfPacket);
    var cmdflg = C.Flags.requestsResponse | C.Flags.resetsInactivityTimeout | (targetId ? C.Flags.commandHasTargetId : 0) ;
    command.push(cmdflg);
    sum += cmdflg;
    if (targetId){
      command.push(targetId);
      sum+=targetId;
    }
    commandPushByte(command, deviceId);
    sum += deviceId;
    commandPushByte(command, commandId);
    sum += commandId;
    commandPushByte(command, this.seqNumber);
    sum += this.seqNumber;
    for( var i = 0 ; i < data.length ; i++ ){
        commandPushByte(command, data[i]);
        sum += data[i];
    }
    var chk = (~sum) & 0xff;
    commandPushByte(command, chk);
    command.push(C.APIConstants.endOfPacket);
    return command;
	}

	/* Put a command message on the queue */
	queueMessage( message: any ){

		this.queue.append({
      bolt:    this.bolt,
      command: this.createCommand(message),
      charac:  this.bolt.characs.get(C.APIV2_CHARACTERISTIC), 
    });

	}

  /* Waking up Sphero */
	wake () {
		const message = {
      name: 'wake',
			deviceId: C.DeviceId.powerInfo,
			commandId: C.Cmds.power.wake, // PowerCommandIds.wake,
			data: [] as any[],
		}
		this.queueMessage(message);
	}

  /* Set the color of the LEd matrix and front and back LED */
	setAllLeds(r:any, g:any, b:any){
		this.setLedsColor(r, g, b);
		this.setMatrixColor(r, g, b);
	}

  	/* Resets the locator */
	resetLocator(){
		const message = {
      name:      'resetLocator',
      deviceId:  C.DeviceId.sensor,
      commandId: C.Cmds.sensor.resetLocator, // SensorCommandIds.resetLocator,
      targetId:  0x12,
      data:      [] as any,
		}
		this.queueMessage(message);
	}

  setLedsColor(r:any, g:any, b:any){
		const message = {
      name: 'setLedsColor',
			deviceId: C.DeviceId.userIO,
			commandId: C.Cmds.io.allLEDs,
			data: [0x3f, r, g, b, r, g, b],
		};
		this.queueMessage(message);
	}

  setMatrixColor(r:any, g:any, b:any){
		const message = {
      name: 'setMatrixColor',
			deviceId: C.DeviceId.userIO,
			commandId: C.Cmds.io.matrixColor, // UserIOCommandIds.matrixColor,
			targetId: 0x12,
			data: [r, g, b], 
		}
		this.queueMessage(message);
	}



}