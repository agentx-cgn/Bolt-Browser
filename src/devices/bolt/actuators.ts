

import { CONSTANTS as C } from '../constants';
import { wait, commandPushByte } from './utils';
import { Queue } from './queue';
import { Bolt } from './bolt';
import { ICmdMessage } from './interfaces';

export class Actuators {

  // private queue: Queue;
  private heading: number;
  private bolt: Bolt;

  constructor (bolt: Bolt) {
    this.bolt  = bolt;
    // this.queue = bolt.queue;
  }


  // /* Put a command message on the queue */
  // queueMessage( message: ICmdMessage ){
  //   this.queue.append({
  //     name:    message.name,
  //     bolt:    this.bolt,
  //     command: this.bolt.createCommand(message),
  //     charac:  this.bolt.characs.get(C.APIV2_CHARACTERISTIC), 
  //     acknowledged: false,
	// 		executed: false,
  //   });
  // }


  // - - - - - ACTUATORS - - - - //
  
  /* Waking up Bolt */
  async wake () { return this.bolt.queueMessage({
    name:      'wake',
    device:    C.DeviceId.powerInfo,
    command:   C.Cmds.power.wake, // PowerCommandIds.wake,
    target:    0x11,
    data:      [] as any[],
  });}

  /* Pause Bolt */
  async sleep () { return this.bolt.queueMessage({
    name:      'sleep',
    device:    C.DeviceId.powerInfo,
    command:   C.Cmds.power.sleep, // .wake, // PowerCommandIds.wake,
    data:      [] as any[],
  });}


	/* Enables collision detection */
	async configureCollisionDetection(xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
		return this.bolt.queueMessage({
			name: 'configureCollisionDetection',
			device: C.DeviceId.sensor,
			command: C.Cmds.sensor.configureCollision, // SensorCommandIds.configureCollision,
			target: 0x12,
			data: [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]
		});

	}


  // - - - - - COMPASS


  /* Resets the locator */
  async resetLocator () {
    return this.bolt.queueMessage({
      name:      'resetLocator',
      device:    C.DeviceId.sensor,
      command:   C.Cmds.sensor.resetLocator, // SensorCommandIds.resetLocator,
      target:    0x12,
      data:      [] as any,
    });  
  }  
  
  /* Finds the north */
  async calibrateToNorth () {
    return this.bolt.queueMessage({
      name:      'calibrateToNorth', 
      device:    C.DeviceId.sensor,
      command:   C.Cmds.sensor.calibrateToNorth, // SensorCommandIds.calibrateToNorth,
      target:    0x12,
      data:      [] as any,
    });  
  }  


  // - - - - - LIGHT
  
  /* Set the color of the LEd matrix and front and back LED */
  async setAllLeds(r: number, g: number, b: number){
    await this.setLedsColor(r, g, b);
    await this.setMatrixColor(r, g, b);
  }      

  /* Set the color of the matrix to random color */
  async setMatrixRandomColor(){
    const color = Math.round(0xffffff * Math.random());
    const r = color >> 16, g = color >> 8 & 255, b = color & 255;
    return this.setMatrixColor(r, g, b);
  }      

  async setMatrixImage(br: number, bg: number, bb: number, r: number, g: number, b: number, image: number[][]) {
    await this.setMatrixColor(br, bg, bb);
    let x: number, y: number;
    for (x=0; x<8; x++){
      for (y=0; y<8; y++){
        if(image[x][y]) {
          await this.setMatrixPixel (x, y, r, g, b);
        }
      }
    }
  }

  // no error, no effect, just blinks
  async rotateMatrix(rotation: number) {
    return this.bolt.queueMessage({
      name:      'rotateMatrix',
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.matrixRotation,
      target:    0x12,
      data:      [rotation],
    });  
  }


  async setLedsColor(fr: number, fg: number, fb: number, br?: number, bg?: number, bb?: number){
    const hasBackColor = br !== undefined && bg !== undefined && bg !== undefined; 
    const data = hasBackColor ? [0x3f, fr, fg, fb, br, bg, bb] : [0x3f, fr, fg, fb, fr, fg, fb];
    return this.bolt.queueMessage({
      name:      'setLedsColor',
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.allLEDs,
      data,
    });  
  }  

  async setMatrixColor(r: number, g: number, b: number){
    return this.bolt.queueMessage({
      name:      'setMatrixColor',
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.matrixColor, // UserIOCommandIds.matrixColor,
      target:    0x12,
      data:      [r, g, b], 
    });  
  }  

  // async setMatrixFill(intensity: number, b: number){
  //   return this.bolt.queueMessage({
  //     name:      'setMatrixColor',
  //     device:    C.DeviceId.userIO,
  //     command:   C.Cmds.io.matrixColor, // UserIOCommandIds.matrixColor,
  //     target:    0x12,
  //     data:      [r, g, b], 
  //   });  
  // }  

  /* Prints a char on the LED matrix  */
  async printChar(char: string, r: number, g: number, b: number){
    return this.bolt.queueMessage({
      name:      'printChar', 
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.printChar, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [r, g, b, char.charCodeAt(0)]
    });  
  }  

  async setMatrixPixel (x: number, y: number, r: number, g: number, b: number) {
    return this.bolt.queueMessage({
      name:      'setMatrixPixel', 
      device:    C.DeviceId.userIO,
      command:   C.Cmds.io.matrixPixel, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [x, y, r, g, b]
    });  
  }

  
  // - - - - - MOVEMENT  
  // https://sdk.sphero.com/docs/sdk_documentation/drive/
  
  /* Sets Sphero heading */
  async setHeading(heading: number){
    if (heading < 0 ){
      heading += 360 ;
    }  
    return this.roll(0, heading, [] as any);
    // await wait(1000);
    // this.resetYaw();
  }  
  
  // Sets the current orientation as orientation 0°ho
  // Sets current yaw angle to zero. (ie current direction is now considered 'forward'.)
  async resetYaw () {
    this.heading = 0;
    return this.bolt.queueMessage({
      name:       'resetYaw',
      device:     C.DeviceId.driving,
      command:    C.Cmds.driving.resetYaw, // DrivingCommandIds.resetYaw,
      target:     0x12,
      data:       [] as any,
    });  
  }  

  // Drive towards a heading at a particular speed. Flags can be set to modify driving mode.
  async roll(speed: number , heading: number, flags=[]as any) {
    return this.bolt.queueMessage({
      name:    'roll',
      device:  C.DeviceId.driving,
      command: C.Cmds.driving.driveWithHeading, // DrivingCommandIds.driveWithHeading,
      target:  0x12,
      data:    [speed, (heading >> 8) & 0xff, heading & 0xff, flags],
    });  
  
    this.heading = heading;
  
  }  


  /* Sets Sphero heading */
  async rotate (degrees: number){
    // if (heading < 0 ){
    //   heading += 360 ;
    // }
    await this.roll(0, degrees, [] as any);
    // this.resetYaw();
  }

  /* Rolls the Sphero */
  async stabilize(index: number){
    return this.bolt.queueMessage({
      name:    'stabilize',
      device:  C.DeviceId.driving,
      command: C.Cmds.driving.stabilization, // .driveWithHeading, // DrivingCommandIds.driveWithHeading,
      target:  0x12,
      data:    [C.StabilizationIndex.full_control_system ],
    });  
  
    // this.heading = heading;
  
  }  

  
}  
