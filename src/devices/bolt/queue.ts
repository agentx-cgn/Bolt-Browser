import m from "mithril";

import { IAction, ICommand, IEvent, ICmdMessage } from './interfaces';
import { CONSTANTS as C } from './constants';
import { Bolt } from './bolt';
import { pushByte } from './utils';
import { Logger } from "../../components/logger/logger";

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

    this.bolt.receiver.on('ack', this.onAcknowledgement.bind(this));

  }

  /* Put a command message on the queue, might execute */
  async queueMessage( message: ICmdMessage ): Promise<any> {

    const prefix = ['%c' + this.bolt.name, 'color: ' + this.bolt.config.colors.console];

    return new Promise( (resolve, reject) => {

      this.incrementer = (this.incrementer +1) % 255;

      const action: IAction = {

        id:           this.incrementer,
        bolt:         this.bolt,
        name:         message.name,
        payload:      message.data,
        device:       message.device,
        command:      message.command,
        target:       message.target || NaN,
        bytes:        new Uint8Array(this.createBytes(this.incrementer, message)),
        charac:       this.bolt.characs.get(C.APIV2_CHARACTERISTIC),
        acknowledged: false,
        executed:     false,
        success:      false,

        onSuccess:    ( command: any ) => {
          // console.log('%c' + this.bolt.name, 'color: darkgreen', 'action.success', message.name);
          action.acknowledged = true;
          action.success = true;
          resolve(action);
          m.redraw();
        },

        onError:      ( error: string ) => {
          console.warn(...prefix, 'error', message, error);
          action.acknowledged = true;
          reject(error);
          m.redraw();
        },

      }

      this.execute(action);

    });

  }

  findNextAction (): IAction {
    return this.find( (action: IAction) => !action.acknowledged && !action.executed );
  }

  execute (action: IAction) {

    // happens if queue empty
    if (!action) { return }

    // const findNextAction = () => this.find( (action: IAction) => !action.acknowledged && !action.executed ) as IAction;

    this.queue.push(action);
    // TODO RingBuffer
    this.queue.length > 200 && this.queue.shift();

    if ( !this.waiting ) {

      this.waiting = true;

      const nextAction = this.findNextAction();

      this.write( nextAction, (lastAction: IAction) => {

        this.waiting = false;
        // lastAction.executed = true;
        this.execute(this.findNextAction());
        m.redraw();

      });

    }

  }

  /**  Write a command on a action characteristic */
  async write ( action: IAction, callback: any ) {

    try {
      Logger.action(this.bolt, action);
      // await action.charac.writeValue(new Uint8Array(action.bytes));
      await action.charac.writeValue(action.bytes);

    } catch(error) {
      console.log('Queue.write.error', error.message);

    } finally {
      action.executed = true;
      callback(action);

    }

  }

  /** An action got acknowledged */
  onAcknowledgement ( event: IEvent ) {

    const command: ICommand = event.msg;
    const action:  IAction  = this.find( (action: IAction) => action.id === command.seqNumber );

    if (!action) debugger;

    switch ( command.data[0] ) {

      case C.Errors.success:

        action.response = command.data.slice(1); //, -1 ??
        action.onSuccess();

        // don't log if only success
        if ( (command.data.length > 1) ) {
          if ( !(
            // no longer interested in these
            action.name === 'batteryVoltage' ||
            action.name === 'ambientLight'
          )) {
            console.log(this.bolt.name, 'Queue.notify.data', action.name, command.data)
          }
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
  createBytes( id: number, message: ICmdMessage ) {

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
