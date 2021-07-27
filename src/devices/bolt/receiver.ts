
import { CONSTANTS as C } from '../constants';
// import { Queue } from './queue';
import { Bolt } from './bolt';
import { Sensors } from './sensors';
import { ICmdMessage, ICommand, ISensorData } from './interfaces';
import { decodeFlags, logDataView, maskToRaw, parseSensorResponse, flatSensorMask, wait } from './utils';

export interface IEvent {
  msg?:      any,
  sender?:   any,
  data?:     any
}

export class Receiver {

  private bolt:      Bolt;
  private callbacks: any;
  private sensors:   Sensors;

  public logs = {
    sensor: [] as any, // as unknown as ISensorData[],
    // sensor: ISensorData[] = [],
  };

  constructor (bolt: Bolt) {
    this.bolt      = bolt;
    this.sensors   = bolt.sensors;
    this.callbacks = {};
    
  }

  on( event: string, callback: any ){
    if(!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
  }

  off( event: string, callback: any ){ 
    if (this.callbacks[event]) {
      const index = this.callbacks.findIndex(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 0);
      }
    }
  }

  fire (event: string, msg: IEvent) {
    const callbacks = this.callbacks[event];
    if (callbacks) {
      callbacks.forEach(( callback: any ) => callback(msg));
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

  getCharacteristicValueParser() {

    let self = this, i, packet: any[], sum: number, escaped: boolean;

    const decodePacket       = this.decodePacket.bind(this);
    const interpreteCommand  = this.interpreteCommand.bind(this);

    function init() {
      sum     = 0;
      packet  = [];
      escaped = false;
    }

    return function onCharacteristicValueChanged (event: any) {

      let len = event.target.value.byteLength;

      for (i = 0; i < len; i++) {

        let value = event.target.value.getUint8(i);

        switch (value) {

          case C.APIConstants.startOfPacket:
            if (packet === undefined || packet.length != 0) { init(); }
            packet.push(value);
            break;

          case C.APIConstants.endOfPacket:
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

            const command = decodePacket(packet);
            interpreteCommand(command);
            init();

          break;

          case C.APIConstants.escape:
            escaped = true;
            break;

          case C.APIConstants.escapedEscape:
          case C.APIConstants.escapedStartOfPacket:
          case C.APIConstants.escapedEndOfPacket:
            if (escaped) {
              value   = value | C.APIConstants.escapeMask;
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

    }.bind(self);

  }

  /* Incoming Packet decoder */
  decodePacket( packet: any ) {

    let command = {} as ICommand;

    command.packet = [ ...packet ];
    command.startOfPacket = packet.shift();
    command.flags = decodeFlags(packet.shift());

    if (command.flags.hasTargetId) {
      command.targetId = packet.shift();
    }

    if (command.flags.hasSourceId) {
      command.sourceId = packet.shift();
    }

    command.deviceId  = packet.shift();
    command.commandId = packet.shift();
    command.seqNumber = packet.shift();

    command.data = [];

    let dataLen = packet.length - 2;
    for (let i = 0; i < dataLen; i++) {
      command.data.push(packet.shift());
    }

    command.checksum = packet.shift();
    command.endOfPacket = packet.shift();

    // this.interpreteCommand(command);
    return command;

  }




  /* If the packet is a notification , calls the right handler, else print the command status */
  interpreteCommand( command: ICommand ) {

    if (command.seqNumber === 255) {
      this.handleEvents(command)

    } else {
      this.fire('notification', { msg: command });
      // this.bolt.queue.notify(command);
      this.printCommandStatus(command);

    }

  }

  handleEvents (command: ICommand) {

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
      command.deviceId  === C.DeviceId.powerInfo && 
      command.commandId === C.Cmds.power.batteryStateChange ) {

      switch (command.data[0]) {
        case C.BatteryState.charging:
          this.fire('charging', { msg: command });
          // this.handleCharging(command);
        break;
        case C.BatteryState.notCharging:
          this.fire('notcharging', { msg: command });
          // this.handleNotCharging(command);
        break;
        case C.BatteryState.charged:
          this.fire('charged', { msg: command });
          // this.handleCharged(command)
        break;
        default:
          console.log('Unknown battery state');
      }

    } else if (
      command.deviceId  === C.DeviceId.powerInfo && 
      command.commandId === C.Cmds.power.willSleepAsync ) {

      this.fire('willsleep', { msg: command });
      // this.handleWillSleepAsync(command);

    } else if (
      command.deviceId  === C.DeviceId.powerInfo && 
      command.commandId === C.Cmds.power.sleepAsync ) {

      this.fire('sleep', { msg: command });
      // this.handleSleepAsync(command);

    } else if (
      command.deviceId  === C.DeviceId.powerInfo && 
      command.commandId === C.Cmds.sensor.configureCollision ) { 
      
      this.fire('unkown', { msg: command });
      console.log('EVENT', 'powerInfo', 'configureCollision', command.data);

    } else if (
      command.deviceId  === C.DeviceId.sensor && 
      command.commandId === C.Cmds.sensor.collisionDetectedAsync ) {

      this.fire('collision', { msg: command });
      // this.handleCollision(command);

    } else if (
      command.deviceId  === C.DeviceId.sensor && 
      command.commandId === C.Cmds.sensor.sensorResponse ) {

      const sensordata = parseSensorResponse(command.data, this.bolt.status.rawMask);
      this.logs.sensor.push(sensordata);
      this.fire('sensordata', { data: sensordata });
      // this.handleSensorUpdate(command);

    } else if (
      command.deviceId  === C.DeviceId.sensor && 
      command.commandId === C.Cmds.sensor.compassNotify ) {

      this.fire('compass', { msg: command });
      // this.handleCompassNotify(command);

    } else {
      console.log('handleEvents', 'UNKNOWN EVENT ', command);
      console.log('handleEvents', 'UNKNOWN EVENT ', command.packet);
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


}

