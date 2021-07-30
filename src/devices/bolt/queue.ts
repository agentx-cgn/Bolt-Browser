import m from "mithril";

import { IAction, ICommand, IEvent, ICmdMessage } from './interfaces';
import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';
import { pushByte } from './utils';

export class Queue {
  
  public map;
  public find;
  public forEach;
  public sort;
  
  private incrementer = 0;
  private waiting: boolean;
  private queue:   IAction[];
  private bolt:    Bolt;

  constructor (bolt: Bolt) {

    this.bolt    = bolt;
    this.waiting = false;
    this.queue   = [];
    this.map     = Array.prototype.map.bind(this.queue);
    this.find    = Array.prototype.find.bind(this.queue);
    this.sort    = Array.prototype.sort.bind(this.queue);
    this.forEach = Array.prototype.forEach.bind(this.queue);

    this.bolt.receiver.on('notification', this.onnotification.bind(this));

  }

  /* Put a command message on the queue, might execute */
  async queueMessage( message: ICmdMessage ): Promise<any> {

    return new Promise( (resolve, reject) => {

      this.incrementer = (this.incrementer +1) % 255;

      const action: IAction = {

        id:           this.incrementer,
        name:         message.name,
        bolt:         this.bolt,
        command:      this.createCommand(this.incrementer, message),
        charac:       this.bolt.characs.get(C.APIV2_CHARACTERISTIC), 
        acknowledged: false,
        executed:     false,

        onSuccess:    ( command: any ) => {
          // console.log('%c' + this.bolt.name, 'color: darkgreen', 'action.success', message.name);
          action.acknowledged = true;
          resolve(action);
          m.redraw();
        },

        onError:      ( error: string ) => {
          console.log('%c' + this.bolt.name, 'color: darkorange', 'error', message.name, error);
          action.acknowledged = true;
          reject(error);
          m.redraw();
        },

      }

      this.execute(action);

    });

  }

  execute (action: IAction) {

    const findNextAction = () => this.find( (action: IAction) => !action.acknowledged && !action.executed );

    this.queue.push(action);

    if ( !this.waiting ) {

      this.waiting = true;
      
      const nextAction = findNextAction();
      this.write( nextAction, (lastAction: IAction) => {

        this.waiting = false;
        lastAction.executed = true;
        const nextAction = findNextAction();
        if (nextAction) {
          this.execute(nextAction);
        }
        m.redraw();

      });

    }

  }

  /**  Write a command on a action characteristic */
  async write ( action: IAction, callback: any ) {

    try {
      await action.charac.writeValue(new Uint8Array(action.command));
      // console.log('write.ok', action.bolt.name, action.name, action.id, action.command.join(' '));

    } catch(error) { 
      console.log('Queue.write.error', error.message);	
    
    } finally {
      callback(action);

    }

  }

  /** An action got acknowledged */
  onnotification ( event: IEvent ) {

    const command: ICommand = event.msg;
    const action:  IAction  = this.find( (action: IAction) => action.id === command.seqNumber );

    switch ( command.data[0] ) {

      case C.Errors.success:

        action.responseData = command.data.slice(1); //, -1 ??
        action.onSuccess();

        // don't log if only success
        if ( (command.data.length > 1) ) {
          console.log(this.bolt.name, 'Queue.notify.data', action.name, command.data)
        }


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

  /* Packet encoder */
  createCommand( id: number, message: ICmdMessage ) {

    const { device, command, target, data } = message;
    const flags = C.Flags.requestsResponse | C.Flags.resetsInactivityTimeout | (target ? C.Flags.commandHasTargetId : 0) ;
    const bytes = [];	  
    let checkSum: number = 0;

    bytes.push(C.API.startOfPacket);

    bytes.push(flags);
    checkSum += flags;

    if (target){
      bytes.push(target);
      checkSum += target;
    }

    pushByte(bytes, device);
    checkSum += device;

    pushByte(bytes, command);
    checkSum += command;

    pushByte(bytes, id);
    checkSum += id;

    for( var i = 0 ; i < data.length ; i++ ){
      pushByte(bytes, data[i]);
      checkSum += data[i];
    }

    checkSum = (~checkSum) & 0xff;
    pushByte(bytes, checkSum);

    bytes.push(C.API.endOfPacket);

    return bytes;

  }

}