import m from "mithril";

import { IAction, IMessage, IEvent, IMsgAction } from './interfaces';
import { CONSTANTS as C } from './constants';
import { Bolt } from './bolt';
import { pushByte } from './utils';
import { Logger } from "../../components/logger/logger";

export class Queue {

  public map;
  public find;
  // public forEach;
  // public sort;

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
    // this.sort    = Array.prototype.sort.bind(this.queue);
    // this.forEach = Array.prototype.forEach.bind(this.queue);

    this.bolt.receiver.on('ack', this.onAcknowledgement.bind(this));

  }

  /* Put a command message on the queue, might execute */
  async queueMessage( message: IMsgAction ): Promise<any> {

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
        bytes:        new Uint8Array(this.encodeBytes(this.incrementer, message)),
        charac:       this.bolt.characs.get(C.APIV2_CHARACTERISTIC),
        response:     [],
        acknowledged: false,
        written:      false,
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
    return this.find( (action: IAction) => !action.acknowledged && !action.written ) ;
  }

  execute (action: IAction) {

    // happens if queue empty
    if (!action) { return }

    this.queue.push(action);
    // TODO RingBuffer
    this.queue.length > 250 && this.queue.shift();

    if ( !this.waiting ) {
      this.waiting = true;
      this.write( this.findNextAction(), () => {
        this.waiting = false;
        this.execute(this.findNextAction());
        m.redraw();
      });

    }

  }

  /**  Write a command on a action characteristic */
  async write ( action: IAction, callback: any ) {

    try {
      Logger.action(this.bolt, action);
      await action.charac.writeValue(action.bytes);

    } catch(error) {
      console.log('Queue.write.error', error.message);

    } finally {
      action.written =  true;
      callback();

    }

  }

  /** An action got acknowledged */
  onAcknowledgement ( event: IEvent ) {

    const message: IMessage = event.msg;
    const action:  IAction  = this.find( (action: IAction) => action.id === message.id );

    if (!action) debugger;

    switch ( message.payload[0] ) {

      case C.Errors.success:
        action.response.push.apply(action.response, message.payload.slice(1));
        action.onSuccess();
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
  encodeBytes( id: number, message: IMsgAction ) {

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
