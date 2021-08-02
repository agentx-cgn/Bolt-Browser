

import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';
import { IEvent, TColor, TNum } from './interfaces';
import { maskToRaw, flatSensorMask, wait } from './utils';
import { Aruco } from '../../services/aruco';
import { H } from "../../services/helper";

export class Actuators {

  private bolt: Bolt;

  private commands = {
    wake:              { device: C.Device.powerInfo, command: C.CMD.Power.wake,                             data: [] as TNum },
    sleep:             { device: C.Device.powerInfo, command: C.CMD.Power.sleep,                            data: [] as TNum },
    hibernate:         { device: C.Device.powerInfo, command: C.CMD.Power.deepSleep,                        data: [] as TNum },
    batteryVoltage:    { device: C.Device.powerInfo, command: C.CMD.Power.batteryVoltage,     target: 0x11, data: [] as TNum },
    calibrateCompass:  { device: C.Device.sensor,    command: C.CMD.Sensor.calibrateToNorth,  target: 0x12, data: [] as TNum },
    resetLocator:      { device: C.Device.sensor,    command: C.CMD.Sensor.resetLocator,      target: 0x12, data: [] as TNum },
    ambientLight:      { device: C.Device.sensor,    command: C.CMD.Sensor.ambientLight,      target: 0x12, data: [] as TNum },
    stabilize:         { device: C.Device.driving,   command: C.CMD.Driving.stabilization,    target: 0x12, data: [ /* index */ ] as TNum },
    resetYaw:          { device: C.Device.driving,   command: C.CMD.Driving.resetYaw,         target: 0x12, data: [] as TNum },
    roll:              { device: C.Device.driving,   command: C.CMD.Driving.driveWithHeading, target: 0x12, data: [ /* speed, (heading >> 8) & 0xff, heading & 0xff, flags */] as TNum },
    rotateMatrix:      { device: C.Device.userIO,    command: C.CMD.IO.matrixRotation,        target: 0x12, data: [ /* 0|1|2|3 */ ] as TNum },
    setMatrixColor:    { device: C.Device.userIO,    command: C.CMD.IO.matrixColor,           target: 0x12, data: [ /* r, g, b */ ] as TNum },

    // batteryPercentage: { device: C.Device.powerInfo, command: C.CMD.Power.get_battery_percentage,     target: 0x11, data: [] as TNum },

  } as any;

  constructor (bolt: Bolt) {
    this.bolt  = bolt;
  }

  async queue (name: string, overwrites: any={} ) {
    const command = Object.assign( { name }, this.commands[name], overwrites);
    return await this.bolt.queue.queueMessage(command);
  }


// - - - - - ACTUATORS - - - - //

// EDU: current firmware versions 4.2.41, 4.2.44

// night, ceiling light: [0, 65, 64, 82, 18], [0, 65, 66, 43, 241], [0, 65, 64, 82, 18]
// battery max 164, min: 1.01

  async info () {
    await this.batteryVoltage();
    await this.ambientLight();
    // await this.getInfo(C.CMD.SystemInfo.mainApplicationVersion);
    // await this.getInfo(C.CMD.SystemInfo.bootloaderVersion);
    // await this.batteryPercentage(); bad command ID
  }


// - - - - - BASIC - - - - //

  async wake             () { return await this.queue('wake') }
  async sleep            () { return await this.queue('sleep') }
  async hibernate        () { return await this.queue('hibernate') }
  async resetYaw         () { return await this.queue('resetYaw') }  // /* Sets the current orientation as orientation 0°, use only after calibrate compass */
  async calibrateCompass () { return await this.queue('calibrateCompass') }

  async resetLocator     () {
    return await this
      .queue('resetLocator')
      .then( () => { this.bolt.status.position = { x: 0, y: 0}; })
    ;
  }


  // - - - - - INFO - - - - //

  async batteryVoltage   () {
    return await this
      .queue('batteryVoltage')
      .then( cmd => { this.bolt.status.voltage = cmd.responseData; })
    ;
  }
  async batteryPercentage   () {
    return await this
      .queue('batteryPercentage')
      .then( cmd => { this.bolt.status.percentage = cmd.responseData; })
    ;
  }
  async ambientLight () {
    return await this
      .queue('ambientLight')
      .then( cmd => this.bolt.status.ambient = cmd.responseData )
    ;
  }


  // - - - - - DRIVING - - - - //

  // flags=Flag.requests_response.value | Flag.command_has_target_id.value | Flag.resets_inactivity_timeout.value

  async stabilizeFull() { return await this.stabilize(C.StabilizationIndex.full_control_system); }
  async stabilizeNone() { return await this.stabilize(C.StabilizationIndex.no_control_system);   }
  async stabilize       ( index: number ) {
    return this
      .queue('stabilize', { data: [index] })
      .then( () => this.bolt.status.stabilization = index )
    ;
  }

  timeDelimiter (msecs: number) {

    const msecsInterval = this.bolt.magic.rollInterval, now = new Date();
    let timeout: number, interval: number;

    console.log('Delimiter.in :', now.toISOString());

    return {
      do (action: any) {

        return new Promise( (resolve) => {

          const finish = () => {
            clearTimeout(timeout);
            clearInterval(interval);
            console.log('Delimiter.out:', (new Date()).toISOString());
            resolve(true);
          }
          interval = window.setInterval(action, msecsInterval);
          timeout  = window.setTimeout(finish, msecs);

        });
      }
    }

  }

  async rollUntil (speed: number, heading: number, delimiter: any) {

    const action = async () => await this.roll(speed, heading);

    return delimiter
      .do(action)
      .then( async () => await this.stop() )
    ;

  }


  async stop () {
    return await this.roll(0, this.bolt.status.heading);
  }

  async roll (speed: number, heading: number, flags: TNum=[]) {
    // "141 26 18 22 7 10 128 0 0  44 216"
    this.bolt.heading = heading;
    return await this
      .queue('roll',  { data: [speed, (this.bolt.heading >> 8) & 0xff, this.bolt.heading & 0xff, flags] })
    ;
  }

  async rotate (degrees=0) {
    return await this.roll(0, this.bolt.heading + degrees);
  }

  async piroutte () {

    const steps = 10, delta = 360 / steps;
    const start = (this.bolt.heading + delta) % 360, end = start + 360;
    const range = H.range(start, end, delta) as number[];

    console.log(range);

    for (const heading of range) {
      await this.roll(0, heading);
    }

    return Promise.resolve(true);

  }

  async calibrateNorth () {

    return new Promise( async (resolve /*, reject */) => {

      const listener = async (e: IEvent) => {

        this.bolt.receiver.off('compass', listener);

        const angle         = e.sensordata;
        const color: TColor = this.bolt.config.colors.matrix;
        const black: TColor = [0, 0, 0];
        await wait (1500); // time for calibration pirouette
        await this.rotate(angle);
        await wait (500);
        await this.resetYaw();
        this.bolt.heading = 0;
        await this.setMatrixImage(...black, ...color, Aruco.createImage(0));

        console.log('calibrateNorth.event', e);
        resolve(e);

      };

      this.bolt.receiver.on('compass', listener);
      await this.resetYaw();
      await this.calibrateCompass();

    });

  }




// - - - - - LIGHT / MATRIX - - - - //

  async rotateMatrix (rotation: number) {
    this.bolt.status.matrix.rotation = rotation;
    return await this.queue('rotateMatrix', {data: [rotation]});
  }

  async setMatrixColor (r: number, g: number, b: number) {
    // destroys image
    return await this.queue('setMatrixColor', {data: [r, g, b]});
  }

  /* Set the color of the LEd matrix and front and back LED */
  async setAllLeds(r: number, g: number, b: number){
    await this.setLedsColor  (r, g, b);
    await this.setMatrixColor(r, g, b);
    return Promise.resolve(true);
  }

  /* Set the color of the matrix to random color */
  async setMatrixRandomColor(){
    const color = Math.round(0xffffff * Math.random());
    const r = color >> 16, g = color >> 8 & 255, b = color & 255;
    return await this.setMatrixColor(r, g, b);
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
    return Promise.resolve(true);
  }

  /* Prints a char on the LED matrix  */
  async printChar(char: string) {
    return await this.printCharColor(char, ...this.bolt.config.colors.matrix as TColor);
  }
  async printCharColor(char: string, r: number, g: number, b: number){
    return await this.bolt.queue.queueMessage({
      name:      'printChar',
      device:    C.Device.userIO,
      command:   C.CMD.IO.printChar, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [r, g, b, char.charCodeAt(0)]
    });
  }

  async setMatrixPixel (x: number, y: number, r: number, g: number, b: number) {
    return await this.bolt.queue.queueMessage({
      name:      'setMatrixPixel',
      device:    C.Device.userIO,
      command:   C.CMD.IO.matrixPixel, //UserIOCommandIds.printChar,
      target:    0x12,
      data:      [x, y, r, g, b]
    });
  }


  async setLedsColor(fr: number, fg: number, fb: number, br?: number, bg?: number, bb?: number){
    const hasBackColor = br !== undefined && bg !== undefined && bg !== undefined;
    const data = hasBackColor ? [0x3f, fr, fg, fb, br, bg, bb] : [0x3f, fr, fg, fb, fr, fg, fb];
    return await this.bolt.queue.queueMessage({
      name:      'setLedsColor',
      device:    C.Device.userIO,
      command:   C.CMD.IO.allLEDs,
      data,
    });
  }

// - - - -  INFO

  // https://sdk.sphero.com/docs/sdk_documentation/system_info/
  async getInfo (what: number) { return await this.bolt.queue.queueMessage({
    name:      'getInfo-' + String(what),
    device:    C.Device.systeminfo,
    // command:   C.CMD.systeminfo.mainApplicationVersion,
    command:   what,
    target:    0x12,
    data:      []
  });
}


// - - - -  CONFIGURE

// * @param  {number} xThreshold An 8-bit settable threshold for the X (left/right)
// * and Y (front/back) axes of Sphero. A value of 00h disables the contribution of that axis.
// * @param  {number} yThreshold An 8-bit settable threshold for the X (left/right)
// * and Y (front/back) axes of Sphero. A value of 00h disables the contribution of that axis.
// * @param  {number} xSpeed An 8-bit settable speed value for the X and Y axes.
// * This setting is ranged by the speed, then added to Xt, Yt to generate the final threshold value.
// * @param  {number} ySpeed An 8-bit settable speed value for the X and Y axes.
// * This setting is ranged by the speed, then added to Xt, Yt to generate the final threshold value.
// * @param  {number} deadTime An 8-bit post-collision dead time to prevent retriggering; specified in 10ms increments.
// * @param  {number=0x01} method Detection method type to use. Currently the only method
// * supported is 01h. Use 00h to completely disable this service.

	/* Enables collision detection */
	async enableCollisionDetection(xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
		return await this.bolt.queue.queueMessage({
			name:    'configureCollisionDetection',
			device:  C.Device.sensor,
			command: C.CMD.Sensor.configureCollision, // SensorCommandIds.configureCollision,
			target:  0x12,
			data:    [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]
		});

	}

  /* Enables sensor data streaming */
	async disableSensors() {
    var mask = [ C.SensorMaskValues.off ];
		this.bolt.status.rawMask = maskToRaw(mask);
		await this.sensorMask(flatSensorMask(this.bolt.status.rawMask.aol), 0);
		await this.sensorMaskExtended(flatSensorMask(this.bolt.status.rawMask.gyro));
    return Promise.resolve(true);
  }

	async enableSensorsAll(interval=2000) {
    return await this.enableSensors(interval, [
			C.SensorMaskValues.accelerometer,
			C.SensorMaskValues.orientation,
			C.SensorMaskValues.locator,
			C.SensorMaskValues.gyro,
		]);
  }
	async enableSensorsLocation(interval=1000) {
    return await this.enableSensors(interval, [ C.SensorMaskValues.locator ]);
  }
	async enableSensors(interval: number, mask: number[]) {
		this.bolt.status.rawMask = maskToRaw(mask);
		await this.sensorMask(flatSensorMask(this.bolt.status.rawMask.aol), interval);
		await this.sensorMaskExtended(flatSensorMask(this.bolt.status.rawMask.gyro));
	}

	/* Sends sensors mask to Sphero (acceleremoter, orientation and locator) */
	// https://github.com/Tineyo/BoltAPP/blob/2662d790cbd66eea008af0484aa5a1bd5b720172/scripts/sphero/spheroBolt.js#L170
	async sensorMask(rawValue: number, interval: number) {
		return await this.bolt.queue.queueMessage({
			name:    'sensorMask',
			device:  C.Device.sensor,
			command: C.CMD.Sensor.sensorMask, // SensorCommandIds.sensorMask,
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
		return await this.bolt.queue.queueMessage({
			name: 'sensorMaskExtended',
			device: C.Device.sensor,
			command: C.CMD.Sensor.sensorMaskExtented, // SensorCommandIds.sensorMaskExtented,
			target: 0x12,
			data: [
				(rawValue >> 24) & 0xff,
				(rawValue >> 16) & 0xff,
				(rawValue >> 8) & 0xff,
				rawValue & 0xff,
			],
		});
	}


  // def set_led_matrix_text_scrolling(self, string: str, color: Color, speed: int = 0x10, repeat: bool = True):
  // """
  // Print text on matrix

  // :param str string: max length 6 symbols
  // :param Color color:
  // :param int speed: max value is 0x1e (30)
  // :param bool repeat:
  // :return:
  // """
  // self.request(
  //     command_id=UserIOCommand.set_led_matrix_text_scrolling,
  //     data=[
  //         *color.to_list(),
  //         speed % 0x1e,
  //         int(repeat),
  //         *[ord(c) for c in string[:7]],
  //         0x00,  # end line
  //     ],
  //     target_id=0x12,
  // )

}
