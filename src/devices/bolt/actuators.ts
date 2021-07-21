

import { CONSTANTS as C } from '../../globals/constants';
import { commandPushByte } from './utils';
import { Queue } from './queue';
import { Bolt } from './bolt';
import { ICmdMessage } from './interfaces';



export class Actuators {

  private queue: Queue;
  private heading: number;
  private bolt: Bolt;

  constructor (bolt: Bolt) {
    this.bolt  = bolt;
    this.queue = bolt.queue;
  }


  /* Put a command message on the queue */
  queueMessage( message: ICmdMessage ){
    this.queue.append({
      name:    message.name,
      bolt:    this.bolt,
      command: this.bolt.createCommand(message),
      charac:  this.bolt.characs.get(C.APIV2_CHARACTERISTIC), 
    });
  }


  // - - - - - ACTUATORS - - - - //
  
  /* Set the color of the LEd matrix and front and back LED */
  setAllLeds(r: number, g: number, b: number){
    this.setLedsColor(r, g, b);
    this.setMatrixColor(r, g, b);
  }

  /* Waking up Sphero */
  wake () {
    this.queueMessage({
      name:      'wake',
      device:    C.DeviceId.powerInfo,
      command:   C.Cmds.power.wake, // PowerCommandIds.wake,
      data:      [] as any[],
    });
  }

    /* Resets the locator */
  resetLocator(){
    this.queueMessage({
      name:      'resetLocator',
      device:    C.DeviceId.sensor,
      command:   C.Cmds.sensor.resetLocator, // SensorCommandIds.resetLocator,
      target:    0x12,
      data:      [] as any,
    });
  }

  setLedsColor(r: number, g: number, b: number){
    this.queueMessage({
      name:      'setLedsColor',
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.allLEDs,
      data:      [0x3f, r, g, b, r, g, b],
    });
  }

  setMatrixColor(r: number, g: number, b: number){
    this.queueMessage({
      name:      'setMatrixColor',
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.matrixColor, // UserIOCommandIds.matrixColor,
      target:    0x12,
      data:      [r, g, b], 
    });
  }

  /* Finds the north */
  calibrateToNorth () {
    this.queueMessage({
      name:      'calibrateToNorth', 
      device:    C.DeviceId.sensor,
      command:   C.Cmds.sensor.calibrateToNorth, // SensorCommandIds.calibrateToNorth,
      target:    0x12,
      data:      [] as any,
    });
  }

  /* Sets the current orientation as orientation 0° */
  resetYaw () {
    this.heading = 0;
    this.queueMessage({
      name:       'resetYaw',
      device:     C.DeviceId.driving,
      command:    C.Cmds.driving.resetYaw, // DrivingCommandIds.resetYaw,
      target:     0x12,
      data:       [] as any,
    });
  }

  /* Prints a char on the LED matrix  */
  printChar(char: string, r: number, g: number, b: number){
    this.queueMessage({
      name:      'printChar', 
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.printChar, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [r, g, b, char.charCodeAt(0)]
    });
  }

    /* Rolls the Sphero */
  roll(speed: number , heading: number, flags: number){
    this.queueMessage({
      name:    'roll',
      device:  C.DeviceId.driving,
      command: C.Cmds.driving.driveWithHeading, // DrivingCommandIds.driveWithHeading,
      target:  0x12,
      data:    [speed, (heading >> 8) & 0xff, heading & 0xff, flags],
    });

    this.heading = heading;

  }

    /* Sets Sphero heading */
  async setHeading(heading: number){
    if (heading < 0 ){
      heading += 360 ;
    }
    this.roll(0, heading, [] as any);
    // await wait(1000);
    this.resetYaw();
  }

}
