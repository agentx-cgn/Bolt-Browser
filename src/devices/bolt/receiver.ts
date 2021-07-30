
import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';
import { ICmdMessage, ICommand, IEvent, ISensorData } from './interfaces';
import { decodeFlags, logDataView, maskToRaw, parseSensorResponse, flatSensorMask, wait } from './utils';

export class Receiver {

  private bolt:      Bolt;
  private listeners: any;

  public logs = {
    sensor: [] as any,
  };

  constructor (bolt: Bolt) {
    this.bolt      = bolt;
    this.listeners = {};
  }

  on ( event: string, callback: any ) {
    if(!this.listeners[event]) { this.listeners[event] = []; }
    this.listeners[event].push(callback);
  }

  off ( event: string, callback: any ) { 
    if (this.listeners[event]) {
      const index = this.listeners[event].findIndex( (cb: any) => cb === callback);
      if ( index > -1 ) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  fire (event: string, msg: IEvent) {
    const listeners = this.listeners[event];
    if (listeners) {
      listeners.forEach(( callback: any ) => callback(msg));
    }
  }

      
  onGattServerDisconnected (event: any) {
    console.log(this.bolt.name, 'onGattServerDisconnected', event);
  }

  onAdvertisementReceived  (event: BluetoothAdvertisementEvent) {
    
    console.log('  Device Name: ' + event.device.name);
    console.log('  Device ID: '   + event.device.id);
    console.log('  RSSI: '        + event.rssi);
    console.log('  TX Power: '    + event.txPower);
    console.log('  UUIDs: '       + event.uuids);
    
    event.manufacturerData.forEach(( valueDataView: DataView, key: number ) => {
      logDataView('Manufacturer', String(key), valueDataView);
    });
    event.serviceData.forEach(( valueDataView: DataView, key: string ) => {
      logDataView('Service', key, valueDataView);
    });
    
  }


/*-------------------------------------------------------------------------------
                NOTIFICATIONS 
-------------------------------------------------------------------------------*/

  /* If the packet is a notification , calls the right handler, else print the command status */
  processPacket( packet: number[] ) {

    const command = this.decodePacket(packet);

    if (command.seqNumber === 255) {
      this.fireEvent(command);

    } else {
      // check error here
      this.fire('notification', { msg: command });
      // this.bolt.queue.notify(command);
      this.printCommandStatus(command);

    }

  }
  
  getCharacteristicValueParser() {

    let i, packet: any[], sum: number, escaped: boolean;

    function init() {
      sum     = 0;
      packet  = [];
      escaped = false;
    }

    const finalize = (packet: number[]) => {
      this.processPacket(packet);
      init();
    }

    return function onCharacteristicValueChanged (event: any) {

      let len = event.target.value.byteLength;

      for (i = 0; i < len; i++) {

        let value = event.target.value.getUint8(i);

        switch (value) {

          case C.API.startOfPacket:
            if (packet === undefined || packet.length != 0) { init(); }
            packet.push(value);
            break;

          case C.API.endOfPacket:

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
            finalize(packet);

          break;

          case C.API.escape:
            escaped = true;
            break;

          case C.API.escapedEscape:
          case C.API.escapedStartOfPacket:
          case C.API.escapedEndOfPacket:
            if (escaped) {
              value   = value | C.API.escapeMask;
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

    };

  }

  /* Incoming Packet decoder */
  decodePacket( packet: any ): ICommand {

    let command = { data: [], packet: [ ...packet ] } as ICommand;

    command.startOfPacket = packet.shift();
    command.flags         = decodeFlags(packet.shift());

    command.flags.hasTargetId && (command.targetId = packet.shift());
    command.flags.hasSourceId && (command.sourceId = packet.shift());

    command.deviceId  = packet.shift();
    command.commandId = packet.shift();
    command.seqNumber = packet.shift();

    let dataLen = packet.length - 2;
    for (let i = 0; i < dataLen; i++) {
      command.data.push(packet.shift());
    }

    command.checksum    = packet.shift();
    command.endOfPacket = packet.shift();

    return command;

  }



  fireEvent (command: ICommand) {

    /**
     * on charging
     * on not charging
     * on charged
     * on collision
     * on compass
     * on sensor data
     * on will sleep
     * on sleep
     * on unknown
     * on error
     * on acknowledged
     * on time
     */

    if (
      command.deviceId  === C.Device.powerInfo && 
      command.commandId === C.CMD.Power.batteryStateChange ) {

      switch (command.data[0]) {
        case C.Battery.charging:
          this.fire('charging',    { msg: command });
        break;
        case C.Battery.notCharging:
          this.fire('notcharging', { msg: command });
        break;
        case C.Battery.charged:
          this.fire('charged',     { msg: command });
        break;
        default:
          console.log('Unknown battery state');
      }

    } else if (
      command.deviceId  === C.Device.powerInfo && 
      command.commandId === C.CMD.Power.willSleepAsync ) {

      this.fire('willsleep', { msg: command });

    } else if (
      command.deviceId  === C.Device.powerInfo && 
      command.commandId === C.CMD.Power.sleepAsync ) {

      this.fire('sleep', { msg: command });
      // this.handleSleepAsync(command);

    } else if (
      command.deviceId  === C.Device.powerInfo && 
      command.commandId === C.CMD.sensor.configureCollision ) { 
      
      this.fire('unkown', { msg: command });
      // console.log('EVENT.unknown', 'powerInfo', 'configureCollision', command.data);
      console.log('EVENT.unknown', command);

    } else if (
      command.deviceId  === C.Device.sensor && 
      command.commandId === C.CMD.sensor.collisionDetectedAsync ) {

      this.fire('collision', { msg: command });
      // this.handleCollision(command);

    } else if (
      command.deviceId  === C.Device.sensor && 
      command.commandId === C.CMD.sensor.sensorResponse ) {

      const sensordata = parseSensorResponse(command.data, this.bolt.status.rawMask);
      this.logs.sensor.push(sensordata);
      this.fire('sensordata', { sensordata });
      // this.handleSensorUpdate(command);

    } else if (
      command.deviceId  === C.Device.sensor && 
      command.commandId === C.CMD.sensor.compassNotify ) {

      let angle = command.data[0] << 8;
      angle    += command.data[1];

      this.fire('compass', { sensordata: angle });
      // this.handleCompassNotify(command);

    } else {
      console.log('fireEvent', 'UNKNOWN EVENT ', command);
      console.log('fireEvent', 'UNKNOWN EVENT ', command.packet);
      this.fire('unkown', { msg: command });

      // this.printCommandStatus(command)

      // after wake :   UNKNOWN EVENT 141, 40,  1, 19, 17, 255, 179, 216
      // put in cradle  UNKNOWN EVENT 141, 56, 17,  1, 19,  28, 255,   1, 134, 216]


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
        console.log('Error: Bad command id', command);
        break;
      case C.Errors.notYetImplemented:
        console.log('Error: Bad device id');
        break;
      case C.Errors.commandIsRestricted:
        console.log('Error: Command is restricted');
        break;
      case C.Errors.badDataLength:
        console.log(this.bolt.name, command.name, 'Error: Bad data length', command);
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


}

