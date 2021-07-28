

import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';
import { IEvent } from './interfaces';
import { maskToRaw, flatSensorMask, wait } from './utils';

export class Actuators {

  private bolt: Bolt;
  
  private commands = {
    wake:              { device: C.Device.powerInfo, command: C.CMD.Power.wake,                            data: [] as any },
    sleep:             { device: C.Device.powerInfo, command: C.CMD.Power.sleep,                           data: [] as any },
    batteryStatus:     { device: C.Device.powerInfo, command: C.CMD.Power.batteryVoltage,    target: 0x11, data: [] as any },
    calibrateCompass:  { device: C.Device.sensor,    command: C.CMD.sensor.calibrateToNorth, target: 0x12, data: [] as any },
    resetLocator:      { device: C.Device.sensor,    command: C.CMD.sensor.resetLocator,     target: 0x12, data: [] as any },
    rotateMatrix:      { device: C.Device.userIO,    command: C.CMD.IO.matrixRotation,       target: 0x12, data: [ /* 0|1|2|3 */ ] as any },
    setMatrixColor:    { device: C.Device.userIO,    command: C.CMD.IO.matrixColor,          target: 0x12, data: [ /* r, g, b */ ] as any },
  } as any;

  constructor (bolt: Bolt) {
    this.bolt  = bolt;
  }

  queue (name: string, overwrites: any={} ) {
    const command = Object.assign( { name }, this.commands[name], overwrites);
    return this.bolt.queue.queueMessage(command);
  }


  // - - - - - ACTUATORS - - - - //
  
  async wake             () { return this.queue('wake') }
  async sleep            () { return this.queue('sleep') }
  async resetLocator     () { return this.queue('resetLocator') }
  async calibrateCompass () { return this.queue('calibrateCompass') }
  async batteryStatus    () { return this.queue('batteryStatus') }

  async rotateMatrix (rotation: number) { 
    await this.queue('rotateMatrix', {data: [rotation]});
    this.bolt.status.matrix.rotation = rotation;
  }

  async setMatrixColor (r: number, g: number, b: number) { 
    // destroys image
    await this.queue('setMatrixColor', {data: [r, g, b]});
  }

  async orientNorth () {

    const listener = (e: IEvent) => {
      this.bolt.receiver.off('compass', listener);
      console.log('orientNorth.event', e);
    };

    this.bolt.receiver.on('compass', listener);
    await this.calibrateCompass();

  }

  ///////////////// PYSPHERO: https://github.com/EnotYoyo/pysphero

  // DrivingCommand.raw_motor,
  // target_id=0x12,
  // data=[
  //     left_direction, left_speed & 0xff,
  //     right_direction, right_speed & 0xff,
  // ],

  // DrivingCommand.tank_drive,
  // data=[left_speed, right_speed, direction.value],
  // target_id=0x12,

  // DrivingCommand.set_ackermann_steering_parameters, also: ackermann_reset(
  // data=[*steering.to_bytes(4, "big"), *direction.to_bytes(4, "big")],
  // flags=Flag.resets_inactivity_timeout.value

  // def get_ambient_light_sensor_value(self) -> float: get_ambient_light_sensor_value = 0x30
  // response = self.request(
  //     command_id=SensorCommand.get_ambient_light_sensor_value,
  //     target_id=0x12,
  // )

  // response = self.request(SystemInfoCommand.get_main_application_version)
  // return Version(
  //     major=int.from_bytes(response.data[:2], "big"),
  //     minor=int.from_bytes(response.data[2:4], "big"),
  //     revision=int.from_bytes(response.data[4:], "big"),

  // response = self.request(SystemInfoCommand.get_bootloader_version)
  // return Version(
  //     major=int.from_bytes(response.data[:2], "big"),
  //     minor=int.from_bytes(response.data[2:4], "big"),
  //     revision=int.from_bytes(response.data[4:], "big"),

  // response = self.request(SystemInfoCommand.get_nordic_temperature)
  // return int.from_bytes(response.data, "big") // 4

  // response = self.request(SystemInfoCommand.get_mac_address)
  // return ":".join(chr(b1) + chr(b2) for b1, b2 in zip(response.data[0::2], response.data[1::2]))




  // async wake () { return this.bolt.queue.queueMessage({
  //   name:      'wake',
  //   device:    C.Device.powerInfo,
  //   command:   C.CMD.Power.wake, // PowerCommandIds.wake,
  //   // target:    0x11,
  //   data:      [] as any[],
  // });}

  /* Pause Bolt */
  // async sleep () { return this.bolt.queue.queueMessage({
  //   name:      'sleep',
  //   device:    C.Device.powerInfo,
  //   command:   C.CMD.Power.sleep,
  //   // target:    0x11,
  //   data:      [] as any[],
  // });}



// - - - -  INFO

  // https://sdk.sphero.com/docs/sdk_documentation/system_info/
  async getInfo (what: number) { this.bolt.queue.queueMessage({
      name:      'getInfo-' + String(what), 
      device:    C.Device.systeminfo,
      // command:   C.CMD.systeminfo.mainApplicationVersion,
      command:   what,
      target:    0x12,
      data:      []
    });  
  }

  // async batteryStatus () { return this.bolt.queue.queueMessage({
  //   name:      'batteryStatus',
  //   device:    C.Device.powerInfo,
  //   command:   C.CMD.Power.batteryVoltage,
  //   target:    0x11,
  //   data:      [] as any[],
  // });}


// - - - -  CONFIGURE

	/* Enables collision detection */
	async configureCollisionDetection(xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
		return this.bolt.queue.queueMessage({
			name:    'configureCollisionDetection',
			device:  C.Device.sensor,
			command: C.CMD.sensor.configureCollision, // SensorCommandIds.configureCollision,
			target:  0x12,
			data:    [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]
		});

	}

  /* Enables sensor data streaming */
	async configureSensorStream(interval=2000) {

		var mask = [
			C.SensorMaskValues.accelerometer,
			C.SensorMaskValues.orientation,
			C.SensorMaskValues.locator,
			C.SensorMaskValues.gyro,
		];

		this.bolt.status.rawMask = maskToRaw(mask);
		await this.sensorMask(flatSensorMask(this.bolt.status.rawMask.aol), interval);
		await this.sensorMaskExtended(flatSensorMask(this.bolt.status.rawMask.gyro));

	}

	/* Sends sensors mask to Sphero (acceleremoter, orientation and locator) */
	// https://github.com/Tineyo/BoltAPP/blob/2662d790cbd66eea008af0484aa5a1bd5b720172/scripts/sphero/spheroBolt.js#L170
	async sensorMask(rawValue: number, interval: number) {
		return this.bolt.queue.queueMessage({
			name:    'sensorMask',
			device:  C.Device.sensor,
			command: C.CMD.sensor.sensorMask, // SensorCommandIds.sensorMask,
			target:  0x12,
			data: [(
				interval >> 8)   & 0xff,
				interval         & 0xff,
					0,
				(rawValue >> 24) & 0xff,
				(rawValue >> 16) & 0xff,
				(rawValue >> 8)  & 0xff,
				 rawValue        & 0xff,
			],
		});
	}

	/* Sends sensors mask to Sphero (gyroscope) */
	async sensorMaskExtended(rawValue: any) {
		return this.bolt.queue.queueMessage({
			name: 'sensorMaskExtended',
			device: C.Device.sensor,
			command: C.CMD.sensor.sensorMaskExtented, // SensorCommandIds.sensorMaskExtented,
			target: 0x12,
			data: [
				(rawValue >> 24) & 0xff,
				(rawValue >> 16) & 0xff,
				(rawValue >> 8) & 0xff,
				rawValue & 0xff,
			],
		});
	}

  // - - - - - COMPASS

  /* Resets the locator */
  // async resetLocator () {
  //   return this.bolt.queue.queueMessage({
  //     name:      'resetLocator',
  //     device:    C.Device.sensor,
  //     command:   C.CMD.sensor.resetLocator, // SensorCommandIds.resetLocator,
  //     target:    0x12,
  //     data:      [] as any,
  //   });  
  // }  
  
  /* Finds the north */
  // async calibrateCompass () {
  //   return this.bolt.queue.queueMessage({
  //     name:      'calibrateCompass', 
  //     device:    C.Device.sensor,
  //     command:   C.CMD.sensor.calibrateToNorth, // SensorCommandIds.calibrateToNorth,
  //     target:    0x12,
  //     data:      [] as any,
  //   });  
  // }  


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
          await this.setMatrixPixel (y, x, r, g, b);
        }
      }
    }
  }

  // no error, no effect, just blinks
  // async rotateMatrix(rotation: number) {
  //   return this.bolt.queue.queueMessage({
  //     name:      'rotateMatrix',
  //     device:    C.Device.userIO,
  //     command:   C.CMD.IO.matrixRotation,
  //     target:    0x12,
  //     data:      [rotation],
  //   });  
  // }

  async setLedsColor(fr: number, fg: number, fb: number, br?: number, bg?: number, bb?: number){
    const hasBackColor = br !== undefined && bg !== undefined && bg !== undefined; 
    const data = hasBackColor ? [0x3f, fr, fg, fb, br, bg, bb] : [0x3f, fr, fg, fb, fr, fg, fb];
    return this.bolt.queue.queueMessage({
      name:      'setLedsColor',
      device:    C.Device.userIO,
      command:   C.CMD.IO.allLEDs,
      data,
    });  
  }  

  // async setMatrixColor(r: number, g: number, b: number){
  //   return this.bolt.queue.queueMessage({
  //     name:      'setMatrixColor',
  //     device:    C.Device.userIO,
  //     command:   C.CMD.IO.matrixColor, // UserIOCommandIds.matrixColor,
  //     target:    0x12,
  //     data:      [r, g, b], 
  //   });  
  // }  

  /* Prints a char on the LED matrix  */
  async printChar(char: string, r: number, g: number, b: number){
    return this.bolt.queue.queueMessage({
      name:      'printChar', 
      device:    C.Device.userIO,
      command:   C.CMD.IO.printChar, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [r, g, b, char.charCodeAt(0)]
    });  
  }  

  async setMatrixPixel (x: number, y: number, r: number, g: number, b: number) {
    return this.bolt.queue.queueMessage({
      name:      'setMatrixPixel', 
      device:    C.Device.userIO,
      command:   C.CMD.IO.matrixPixel, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [x, y, r, g, b]
    });  
  }



// ENHAMCED MOVEMENT



  // async calibrateNorth() {


  // }

  async rollVector(speed: number, length: number, heading: number) {

    // we need calibrate, sensorStream
    


  }
  
  // - - - - - MOVEMENT // target 12
  // https://sdk.sphero.com/docs/sdk_documentation/drive/
  
  /* Sets Sphero heading */
  async setHeading(heading: number){
    heading = heading < 0 ? heading + 360 : heading;
    return this.roll(0, heading, [] as any);
  }  
  
  // Sets the current orientation as orientation 0°ho
  // Sets current yaw angle to zero. (ie current direction is now considered 'forward'.)
  async resetYaw () {
    this.bolt.heading = 0;
    return this.bolt.queue.queueMessage({
      name:       'resetYaw',
      device:     C.Device.driving,
      command:    C.CMD.driving.resetYaw, // DrivingCommandIds.resetYaw,
      target:     0x12,
      data:       [] as any,
    });  
  }  

  // Drive towards a heading at a particular speed. Flags can be set to modify driving mode.
  async roll(speed: number , heading: number, flags=[]as any) {
    return this.bolt.queue.queueMessage({
      name:    'roll',
      device:  C.Device.driving,
      command: C.CMD.driving.driveWithHeading, // DrivingCommandIds.driveWithHeading,
      target:  0x12,
      data:    [speed, (heading >> 8) & 0xff, heading & 0xff, flags],
    });  
  }  


  /* Sets Sphero heading */
  async rotate (degrees: number){
    degrees = degrees < 0 ? degrees + 360 : degrees;
    return this.roll(0, degrees, [] as any);
    // this.resetYaw();
  }

  /* Stabilize the Sphero */
  async stabilize(index: number){
    return this.bolt.queue.queueMessage({
      name:    'stabilize',
      device:  C.Device.driving,
      command: C.CMD.driving.stabilization, // .driveWithHeading, // DrivingCommandIds.driveWithHeading,
      target:  0x12,
      data:    [ index ],
    });  
  }  

  async stabilizeFull() {
    return this.stabilize(C.StabilizationIndex.full_control_system);
  }
  async stabilizeNone() {
    return this.stabilize(C.StabilizationIndex.no_control_system);
  }

  
}  
