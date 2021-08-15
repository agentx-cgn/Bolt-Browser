
import { CONSTANTS as C } from './constants';
import { Bolt } from './bolt';
import { IMessage, IEvent } from './interfaces';
import { decodeFlags, logDataView, parseSensorResponse } from './utils';
import * as Mousetrap from 'Mousetrap';
import { Logger } from '../../components/logger/logger';


export class Receiver {

  private bolt:      Bolt;
  private listeners: any;

  // register keys
  private keymap = {
    'space' : () => { this.fire('key:space'); return false; },
    'esc'   : () => { this.fire('key:esc');   return false; },
    'left'  : () => { this.fire('key:left');  return false; },
    'right' : () => { this.fire('key:right'); return false; },
    'up'    : () => { this.fire('key:up');    return false; },
    'down'  : () => { this.fire('key:down');  return false; },
  };

  public logs = {
    sensor: [] as any,
  };

  constructor (bolt: Bolt) {
    this.bolt      = bolt;
    this.listeners = {};

    for (const [key, fn] of Object.entries(this.keymap)) {
      Mousetrap.bind(key, fn);
    }

  }

  async on ( event: string, listener: any, activate=true ) {

    if(!this.listeners[event]) { this.listeners[event] = []; }

    listener.activate = activate;
    this.listeners[event].push(listener);

    if (event === 'sensordata' && activate) {
      const activeListener = this.listeners[event].filter( (li: any) => li.activate );
      if (activeListener.length > 0) {
        await this.bolt.sensors.enableSensorsAll(this.bolt.magic.sensorInterval);
      }
    }

    return Promise.resolve(true);

  }

  async off ( event: string, listener: any ) {

    if (this.listeners[event]) {
      const index = this.listeners[event].findIndex( (li: any) => li === listener);
      if ( index > -1 ) {
        this.listeners[event].splice(index, 1);
      }
    }

    if (event === 'sensordata') {
      const activeListener = this.listeners[event].filter( (li: any) => li.activate );
      if (activeListener.length === 0) {
        await this.bolt.sensors.disableSensors();
      }
    }

    return Promise.resolve(true);

  }

  fire (event: string, payload={} as IEvent) {
    Logger.event(this.bolt, event, payload);
    const listeners = this.listeners[event];
    if (listeners) {
      listeners.forEach(( callback: any ) => callback(payload));
    }
  }


  onGattServerDisconnected (event: Event) {
    console.log(this.bolt.name, 'onGattServerDisconnected');
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

    const message = this.decodePacket(packet);

    if (message.id === 255) {
      this.fireEvent(message);

    } else {
      // check error here
      this.fire('ack', { msg: message });
      // this.bolt.queue.notify(message);
      this.logOnError(message);

    }

  }

  getCharacteristicValueParser(uuid: string) {

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

      if (uuid !== '00010002-574f-4f20-5370-6865726f2121') { console.log('CharacChanged', uuid, len); }

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
              console.log('Packet is too small', packet);
              init();
              break;
            }
            if (packet[packet.length - 1] !== (~(sum) & 0xff)) {
              console.log('Bad checksum', packet);
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
  decodePacket( packet: any ): IMessage {

    // Packet structure:
    // ---------------------------------
    // - start      [1 byte]
    // - flags      [1 byte]
    // - source_id  [1 byte] (optional)
    // - target_id  [1 byte] (optional)
    // - device_id  [1 byte]
    // - command_id [1 byte]
    // - data       [n byte]
    // - checksum   [1 byte]
    // - end        [1 byte]

    let message = { payload: [], packet: [ ...packet ] } as IMessage;

    message.startOfPacket = packet.shift();
    message.flags         = decodeFlags(packet.shift());

    message.flags.hasTargetId && (message.target = packet.shift());
    message.flags.hasSourceId && (message.source = packet.shift());

    message.device  = packet.shift();
    message.command = packet.shift();
    message.id      = packet.shift();

    let dataLen = packet.length - 2;
    for (let i = 0; i < dataLen; i++) {
      message.payload.push(packet.shift());
    }

    message.checksum    = packet.shift();
    message.endOfPacket = packet.shift();

    return message;

  }



  fireEvent (message: IMessage) {

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
      message.device  === C.Device.powerInfo &&
      message.command === C.CMD.Power.batteryStateChange ) {

      const state = message.payload[0];

      if (state === C.Battery.charging    ||
          state === C.Battery.notCharging ||
          state === C.Battery.charged     ) {

        // charging, not charging, charged
        this.fire('battery', { sensordata: state });

      } else {
        console.log('Unknown battery state', message);

      }

    } else if (
      message.device  === C.Device.powerInfo &&
      message.command === C.CMD.Power.willSleepAsync ) {

      this.fire('willsleep', { msg: message });

    } else if (
      message.device  === C.Device.powerInfo &&
      message.command === C.CMD.Power.sleepAsync ) {

      this.fire('sleep', { msg: message });

    } else if (
      message.device  === C.Device.powerInfo &&
      message.command === C.CMD.Sensor.configureCollision ) {

      // this.fire('unkown', { msg: command });
      // console.log('EVENT.unknown', 'powerInfo', 'configureCollision', command.payload);
      const c = message;
      console.log('EVENT.Unknown', 'src', c.source, 'dev', c.device, 'cmd', c.command);

    } else if (
      message.device  === C.Device.sensor &&
      message.command === C.CMD.Sensor.collisionDetectedAsync ) {

      this.fire('collision', { msg: message });

    } else if (
      message.device  === C.Device.sensor &&
      message.command === C.CMD.Sensor.sensorResponse ) {

      const sensordata = parseSensorResponse(message.payload, this.bolt.status.rawMask);
      if (sensordata.locator) {
        this.fire('sensordata', { sensordata });
      } else {
        console.log('fireEvent.incomplete.sensor.data', sensordata);
      }

    } else if (
      message.device  === C.Device.sensor &&
      message.command === C.CMD.Sensor.compassNotify ) {

      let angle = message.payload[0] << 8;
      angle    += message.payload[1];

      this.fire('compass', { sensordata: angle });

    } else {
      console.log('fireEvent', 'UNKNOWN EVENT ', message);
      console.log('fireEvent', 'UNKNOWN EVENT ', message.packet);
      this.fire('unkown', { msg: message });

      // this.printCommandStatus(message)

      // after wake :   UNKNOWN EVENT 141, 40,  1, 19, 17, 255, 179, 216
      // put in cradle  UNKNOWN EVENT 141, 56, 17,  1, 19,  28, 255,   1, 134, 216]


    }

  }


/*-------------------------------------------------------------------------------
                DEBUG
-------------------------------------------------------------------------------*/

  /* Prints the status of a command */
  logOnError(command: any) {
    switch (command.payload[0]) {
      case C.Errors.success:
        // console.log(this.bolt.name, 'Success', command.seqNumber, command.payload, command.flags);
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
