

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
	createCommand( commandInfo: any ) {

		const { deviceId, commandId, targetId, data } = commandInfo;
	  
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

	/* Put a command on the queue */
	queueCommand( commandInfo: any ){

    const command = this.createCommand(commandInfo);

		this.queue.append({
      command, 
      charac: this.bolt.characs.get(C.APIV2_CHARACTERISTIC), 
    });

	}

  /* Waking up Sphero */
	wake () {
		let commandInfo = {
			deviceId: C.DeviceId.powerInfo,
			commandId: C.Cmds.power.wake, // PowerCommandIds.wake,
			data: [] as any[],
		}
		// let command = this.createCommand(commandInfo);
		this.queueCommand(commandInfo);
	}

  /* Set the color of the LEd matrix and front and back LED */
	setAllLeds(r:any, g:any, b:any){
		this.setLedsColor(r, g, b);
		this.setMatrixColor(r, g, b);
	}

  	/* Resets the locator */
	resetLocator(){
		const commandInfo = {
      deviceId:  C.DeviceId.sensor,
      commandId: C.Cmds.sensor.resetLocator, // SensorCommandIds.resetLocator,
      targetId:  0x12,
      data:      [] as any,
		}
		// let command = this.createCommand(commandInfo)
		this.queueCommand(commandInfo);
	}

  setLedsColor(r:any, g:any, b:any){
		let commandInfo = {
			deviceId: C.DeviceId.userIO,
			commandId: C.Cmds.io.allLEDs,
			data: [0x3f, r, g, b, r, g, b],
		};
		// let command = this.createCommand(commandInfo);
		this.queueCommand(commandInfo);
	}

  setMatrixColor(r:any, g:any, b:any){
		let commandInfo = {
			deviceId: C.DeviceId.userIO,
			commandId: C.Cmds.io.matrixColor, // UserIOCommandIds.matrixColor,
			targetId: 0x12,
			data: [r, g, b], 
		}
		// let command = this.createCommand(commandInfo);
		this.queueCommand(commandInfo);
	}



}