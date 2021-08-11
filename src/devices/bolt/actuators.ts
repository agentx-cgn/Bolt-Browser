

import { CONSTANTS as C } from '../constants';
import { Bolt } from './bolt';
import { IEvent, TColor, TNum, IPoint, ISensorData } from './interfaces';
import { maskToRaw, flatSensorMask, wait } from './utils';
import { Aruco } from '../../services/aruco';
import { H } from "../../services/helper";
import { M } from "../../services/m";

export class Actuators {

  private bolt: Bolt;

  private actions = {
    ping:               { device: C.Device.apiProcessor,  command: C.CMD.Api.ping,                                  data: [] as TNum },
    wake:               { device: C.Device.powerInfo,     command: C.CMD.Power.wake,                                data: [] as TNum },
    sleep:              { device: C.Device.powerInfo,     command: C.CMD.Power.sleep,                               data: [] as TNum },
    hibernate:          { device: C.Device.powerInfo,     command: C.CMD.Power.deepSleep,                           data: [] as TNum },
    // batteryVoltage:     { device: C.Device.powerInfo,     command: C.CMD.Power.batteryVoltage,      target: 0x11,   data: [] as TNum },
    // batteryState:       { device: C.Device.powerInfo,     command: C.CMD.Power.batteryState,        target: 0x11,   data: [] as TNum },
    // ambientLight:       { device: C.Device.sensor,        command: C.CMD.Sensor.ambientLight,       target: 0x12,   data: [] as TNum },
    calibrateCompass:   { device: C.Device.sensor,        command: C.CMD.Sensor.calibrateToNorth,   target: 0x12,   data: [] as TNum },
    resetLocator:       { device: C.Device.sensor,        command: C.CMD.Sensor.resetLocator,       target: 0x12,   data: [] as TNum },
    stabilize:          { device: C.Device.driving,       command: C.CMD.Driving.stabilization,     target: 0x12,   data: [ /* index */] as TNum },
    resetYaw:           { device: C.Device.driving,       command: C.CMD.Driving.resetYaw,          target: 0x12,   data: [] as TNum },
    roll:               { device: C.Device.driving,       command: C.CMD.Driving.driveWithHeading,  target: 0x12,   data: [ /* speed, (heading >> 8) & 0xff, heading & 0xff, flags */] as TNum },
    rotateMatrix:       { device: C.Device.userIO,        command: C.CMD.IO.matrixRotation,         target: 0x12,   data: [ /* 0|1|2|3 */] as TNum },
    matrixColor:     { device: C.Device.userIO,        command: C.CMD.IO.matrixColor,            target: 0x12,   data: [ /* r, g, b */] as TNum },

    // batteryPercentage: { device: C.Device.powerInfo, command: C.CMD.Power.get_battery_percentage,     target: 0x11, data: [] as TNum },

  } as any;

  constructor(bolt: Bolt) {
    this.bolt = bolt;
  }

  async queue(name: string, overwrites: any = {}) {
    const message = Object.assign({ name }, this.actions[name], overwrites);
    return await this.bolt.queue.queueMessage(message);
  }


  // - - - - - ACTUATORS - - - - //




  // - - - - - BASIC - - - - //

  async wake() { return await this.queue('wake') }
  async sleep() { return await this.queue('sleep') }
  async hibernate() { return await this.queue('hibernate') }
  async resetYaw() { return await this.queue('resetYaw') }  // /* Sets the current orientation as orientation 0°, use only after calibrate compass */
  async calibrateCompass() { return await this.queue('calibrateCompass') }

  async resetLocator() {
    return await this
      .queue('resetLocator')
      .then(() => { this.bolt.status.position = { x: 0, y: 0 }; })
      ;
  }


  // - - - - - INFO - - - - //

  async ping() {
    return await this
      .queue('ping')
      .then(data => { console.log('ping', data); })
    ;
  }
  async batteryVoltage() {
    return await this
      .queue('batteryVoltage')
      .then(cmd => { this.bolt.status.voltage = cmd.responseData.slice(-1).join(' '); })
    ;
  }
  async batteryState() {
    return await this
      .queue('batteryState')
      .then(data => { console.log('batteryState', data); })
    ;
  }
  async batteryPercentage() {
    return await this
      .queue('batteryPercentage')
      .then(cmd => { this.bolt.status.percentage = cmd.responseData; })
    ;
  }
  async ambientLight() {
    return await this
      .queue('ambientLight')
      .then(cmd => this.bolt.status.ambient = cmd.responseData.slice(-3).join(' '))
    ;
  }


  // - - - - - DRIVING - - - - //

  // flags=Flag.requests_response.value | Flag.command_has_target_id.value | Flag.resets_inactivity_timeout.value

  async stabilizeFull() { return await this.stabilize(C.StabilizationIndex.full_control_system); }
  async stabilizeNone() { return await this.stabilize(C.StabilizationIndex.no_control_system); }
  async stabilize(index: number) {
    return this
      .queue('stabilize', { data: [index] })
      .then(() => this.bolt.status.stabilization = index)
      ;
  }

  timeDelimiter(msecs: number) {

    const msecsInterval = this.bolt.magic.rollInterval, now = new Date();
    let timeout: number, interval: number;

    console.log('Delimiter.in :', now.toISOString());

    return {
      do(action: any) {

        return new Promise((resolve) => {

          const finish = () => {
            clearTimeout(timeout);
            clearInterval(interval);
            console.log('Delimiter.out:', (new Date()).toISOString());
            resolve(true);
          }
          interval = window.setInterval(action, msecsInterval);
          timeout = window.setTimeout(finish, msecs);

        });
      }
    }

  }

/*
function angle (L, x0, y0, x1, y1) {console.log(L, x0, y0, '|', x1, y1, '=>', ~~(Math.atan2(y0 - y1, x0 - x1) * 180 / Math.PI) -270) }
angle('N', 0, 0,   0,  10)
angle('E', 0, 0,  10,   0)
angle('S', 0, 0,   0, -10)
angle('N', 0, 0, -10,   0)

N 0 0 | 0 10 => -360
VM1231:1 E 0 0 | 10 0 => -90
VM1231:1 S 0 0 | 0 -10 => -180
VM1231:1 N 0 0 | -10 0 => -270

function angle (L, soll, x0, y0, x1, y1) {console.log(L, soll, '=>', +(~~(Math.atan2(y0 - y1, x0 - x1) * -180 / Math.PI) +270) ) }
angle('N',   0, 0,   0,   0,  10)
angle('E',  90, 0,   0,  10,   0)
angle('S', 180, 0,   0,   0, -10)
angle('W', 270, 0,   0, -10,   0)
N 0 => 360
E 90 => 90
S 180 => 180
W 270 => 270

*/

  async circleAround(times: number, radius: number) {

    for (const i of H.range(times)) {

      const angle = Math.random() * Math.PI * 2;
      const point: IPoint = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      }

      await this.rollToPoint(point);

    }

    return Promise.resolve(true);

  }


  async rollToPoint (target: IPoint, tolerance=5) {

    console.log('rollToPoint.in :', this.bolt.status.position, '=>', target);

    return new Promise( async (resolve, reject) => {

      const fullStopListener = async (event: IEvent) => {
        await this.bolt.receiver.off('fullstop',   fullStopListener);
        await this.bolt.receiver.off('sensordata', sensorListener);
        resolve('fullstop');
      };

      const sensorListener = async (event: IEvent) => {

        let speed: number, x: number, y: number, distance: number, heading: number;

        x        = event.sensordata.locator.positionX;
        y        = event.sensordata.locator.positionY;
        distance = Math.hypot(target.x - x, target.y - y);
        heading  = Math.atan2(y - target.y, x - target.x) * -180 / Math.PI +270;
        heading  = (heading + 360) % 360;

        console.log('rollToPoint', heading, this.bolt.heading, heading - this.bolt.heading);

        speed = (
          distance > 100 ? 100 :
          distance >  50 ?  50 :
          distance >  30 ?  30 :
          distance >  20 ?  20 :
          15
        );

        if (distance < tolerance) {
          console.log('rollToPoint.out:', this.bolt.status.position, '=>', target);
          await this.stop();
          await this.bolt.receiver.off('sensordata', sensorListener);
          await this.bolt.receiver.off('fullstop',   fullStopListener);
          resolve(distance);

        } else {
          await this.roll(speed, heading);
          // console.log('rollToPoint.tck:', this.bolt.status.position, '=>', target, 'd', ~~distance, 'h', ~~heading);

        }

      };

      await this.bolt.receiver.on('sensordata', sensorListener);
      await this.bolt.receiver.on('fullstop',   fullStopListener);

    });

  }

  async rollUntil(speed: number, heading: number, delimiter: any) {

    const action = async () => await this.roll(speed, heading);

    return delimiter
      .do(action)
      .then(async () => await this.stop())
    ;

  }


  async stop() {
    // await this.disableSensors();
    return await this.roll(0, this.bolt.status.heading);
  }

  async roll(speed: number, heading: number, flags: TNum = []) {
    // "141 26 18 22 7 10 128 0 0  44 216"
    this.bolt.heading = heading;
    return await this
      .queue('roll', { data: [speed, (this.bolt.heading >> 8) & 0xff, this.bolt.heading & 0xff, flags] })
      ;
  }

  async rotate(degrees = 0) {
    return await this.roll(0, this.bolt.heading + degrees);
  }

  async rollEight(times: number) {




  }

  async circle(speed: number) {

    const steps = 10, delta = 360 / steps;
    const start = (this.bolt.heading + delta) % 360, end = start + 360;
    const range = H.range(start, end, delta) as number[]

    for (const heading of range) {
      await this.roll(speed, heading);
      await wait(1000);
    }

    return await this.stop();

  }

  async piroutte() {

    const steps = 10, delta = 360 / steps;
    const start = (this.bolt.heading + delta) % 360, end = start + 360;
    const range = H.range(start, end, delta) as number[];

    // console.log(range);

    for (const heading of range) {
      await this.roll(0, heading);
    }

    return Promise.resolve(true);

  }

  async calibrateHeading() {

    const p1 = {x:  0, y: 40} as IPoint;  // straight north
    const p2 = {x:  0, y:  0} as IPoint;

    let heading, delta, target: IPoint, posX, posY, velX, velY;

    return new Promise(async (resolve /*, reject */) => {

      const fullStopListener = async (event: IEvent) => {
        await this.bolt.receiver.off('fullstop',   fullStopListener);
        await this.bolt.receiver.off('sensordata', sensorListener);
        resolve('fullstop');
      };

      const sensorListener = async (event: IEvent) => {

        posX   = event.sensordata.locator.positionX;
        posY   = event.sensordata.locator.positionY;
        velX   = event.sensordata.locator.velocityX;
        velY   = event.sensordata.locator.velocityY;

        heading  = Math.atan2(posY - target.y, posX - target.x) * -180 / Math.PI +270;
        heading  = (heading + 360) % 360;

        delta    = M.angleDistance(heading, this.bolt.heading);

        console.log(this.bolt.name, 'calibrate', this.bolt.heading, heading, delta);

      };

      target = p1;

      await this.bolt.receiver.on('sensordata', sensorListener);
      await this.bolt.receiver.on('fullstop',   fullStopListener);

      await this.rollToPoint(target, 5);
      this.piroutte();

      target = p2;
      await this.rollToPoint(target, 5);

      await this.bolt.receiver.off('sensordata', sensorListener);
      await this.bolt.receiver.off('fullstop',   fullStopListener);
      await this.roll(0, 0);

    });

  }
  async calibrateNorth() {

    return new Promise(async (resolve /*, reject */) => {

      const listener = async (e: IEvent) => {

        this.bolt.receiver.off('compass', listener);

        const angle = e.sensordata;
        const color: TColor = this.bolt.config.colors.matrix;
        const black: TColor = [0, 0, 0];
        await wait(1000); // time for calibration pirouette ws 1500
        await this.rotate(angle);
        await wait(200);
        await this.resetYaw();
        this.bolt.heading = 0;
        await this.roll(0, 0);
        await this.setMatrixImage(...black, ...color, Aruco.createImage(0));
        await wait(200);

        console.log('calibrateNorth.heading', this.bolt.heading, 'angle', angle); // works last time checked
        resolve(e);

      };

      this.bolt.receiver.on('compass', listener);
      await this.resetYaw();
      await this.calibrateCompass();

    });

  }




  // - - - - - LIGHT / MATRIX - - - - //

  async rotateMatrix(rotation: number) {
    this.bolt.status.matrix.rotation = rotation;
    return await this.queue('rotateMatrix', { data: [rotation] });
  }

  async matrixColor(r: number, g: number, b: number) {
    // destroys image
    return await this.queue('matrixColor', { data: [r, g, b] });
  }

  /* Set the color of the LEd matrix and front and back LED */
  async setAllLeds(r: number, g: number, b: number) {
    await this.setLedsColor(r, g, b);
    await this.matrixColor(r, g, b);
    return Promise.resolve(true);
  }

  /* Set the color of the matrix to random color */
  async setMatrixRandomColor() {
    const color = Math.round(0xffffff * Math.random());
    const r = color >> 16, g = color >> 8 & 255, b = color & 255;
    return await this.matrixColor(r, g, b);
  }

  async setMatrixImage(br: number, bg: number, bb: number, r: number, g: number, b: number, image: number[][]) {
    await this.matrixColor(br, bg, bb);
    let x: number, y: number;
    for (x = 0; x < 8; x++) {
      for (y = 0; y < 8; y++) {
        if (image[x][y]) {
          await this.setMatrixPixel(y, x, r, g, b);
        }
      }
    }
    return Promise.resolve(true);
  }


  /* Blinks as char  */
  async blinkChar(char: string, times= 3) {
    for (const i of H.range(times)){
      await this.matrixChar(' ');
      await this.matrixChar(char);
      await wait(200);
    }
    return await Promise.resolve(true);
  }

  /* Prints a char on the LED matrix  */
  async matrixChar(char: string) {
    return await this.matrixCharColor(char, ...this.bolt.config.colors.matrix as TColor);
  }
  async matrixCharColor(char: string, r: number, g: number, b: number) {
    return await this.bolt.queue.queueMessage({
      name: 'matrixChar',
      device: C.Device.userIO,
      command: C.CMD.IO.matrixChar, //UserIOCommandIds.matrixChar,
      target: 0x12,
      data: [r, g, b, char.charCodeAt(0)]
    });
  }

  async setMatrixPixel(x: number, y: number, r: number, g: number, b: number) {
    return await this.bolt.queue.queueMessage({
      name: 'setMatrixPixel',
      device: C.Device.userIO,
      command: C.CMD.IO.matrixPixel, //UserIOCommandIds.matrixChar,
      target: 0x12,
      data: [x, y, r, g, b]
    });
  }

  async matrixFill(x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number) {
    return await this.bolt.queue.queueMessage({
      name:    'matrixFill',
      device:  C.Device.userIO,
      command: C.CMD.IO.matrixFill,
      target:  0x12,
      data: [x0, y0, x1, y1, r, g, b]
    });
  }

  // this.drawCompressedFramePlayerLine = function (e, t, r, n, i, a, o) {l["0x1A"]["Draw Compressed Frame Player Line"].function.call (this, e, t, r, n, i, a, o, 18)},
  // this.addCommand("0x1A", "Draw Compressed Frame Player Line", "0x1A", "0x3D", 18),

  // this.drawCompressedFramePlayerFill = function (e, t, r, n, i, a, o) {l["0x1A"]["Draw Compressed Frame Player Fill"].function.call (this, e, t, r, n, i, a, o, 18)},
  // this.addCommand("0x1A", "Draw Compressed Frame Player Fill", "0x1A", "0x3E", 18),


  async setLedsColor(fr: number, fg: number, fb: number, br?: number, bg?: number, bb?: number) {
    const hasBackColor = br !== undefined && bg !== undefined && bg !== undefined;
    const data = hasBackColor ? [0x3f, fr, fg, fb, br, bg, bb] : [0x3f, fr, fg, fb, fr, fg, fb];
    return await this.bolt.queue.queueMessage({
      name: 'setLedsColor',
      device: C.Device.userIO,
      command: C.CMD.IO.allLEDs,
      data,
    });
  }



  // - - - -  ENABLE Notifiers

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

}
