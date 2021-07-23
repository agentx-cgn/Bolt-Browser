import m from "mithril";

import { IAction } from './interfaces';
import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';

let counter: number = 0;

/* The objective of this queue is to send packets in turns to avoid GATT error */
export class Queue {

  private running: boolean;
  private queue:   IAction[];
  private bolt:    Bolt;

  public map;
  public find;

  constructor (bolt: Bolt) {
    this.bolt = bolt;
    this.running = false;
    this.queue = [];
    this.map  = Array.prototype.map.bind(this.queue);
    this.find = Array.prototype.find.bind(this.queue);
  }
  
  findNextAction () {
    return this.find( (action: IAction) => !action.acknowledged );
  }

  append (action: IAction) {
    action.id = (++counter) % 255;
    action.acknowledged = false;
    action.executed = false;
    this.queue.push(action);
    !this.running && this.execAction(action);
  }  

  execAction (action: IAction) {

    this.running = true;
    
    const nextAction = this.findNextAction();
    this.write( nextAction, (lastAction: IAction) => {

      m.redraw()
      this.running = false;
      lastAction.executed = true;
      const nextAction = this.findNextAction();
      if (nextAction) {
        this.execAction(nextAction);
      }

    });

  }

  /*  Write a command on a specific characteristic */
  async write ( action: IAction, callback:any ) {

    try {
      await action.charac.writeValue(new Uint8Array(action.command));
      console.log(action.bolt.name, action.name, action.id, action.command.join(' '));

    } catch(error) { 
      console.log(error.message);	
    
    } finally {
      callback && callback(action);

    }

  }

  /* Prints the status of a command */
	notify (command: any) {

    const action: IAction = this.find( (action: IAction) => action.id === command.seqNumber );

		switch(command.data[0]){
      
			case C.Errors.success:
        action.onSuccess()
      break;

			case C.Errors.badDeviceId:
	      action.onError('Error: Bad device id');
				break;
			case C.Errors.badCommandId:
	      action.onError('Error: Bad command id');
				break;
			case C.Errors.notYetImplemented:
	      action.onError('Error: Bad device id');
				break; 
			case C.Errors.commandIsRestricted:
	      action.onError('Error: Command is restricted');
				break;
			case C.Errors.badDataLength:
	      action.onError('Error: Bad data length');
				break;
			case C.Errors.commandFailed:
	      action.onError('Error: Command failed');
				break;
			case C.Errors.badParameterValue:
	      action.onError('Error: Bad paramater value');
				break;
			case C.Errors.busy:
	      action.onError('Error: Busy');
				break;
			case C.Errors.badTargetId:
	      action.onError('Error: Bad target id');
				break;
			case C.Errors.targetUnavailable:
	      action.onError('Error: Target unavailable');
				break;
			default:
	      action.onError('Error: Unknown error');
		}
	}

}