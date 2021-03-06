

import { CONSTANTS as C } from './constants';
import { Bolt } from './bolt';
import { IEvent, TColor, TNum, IPoint } from './interfaces';
import { wait } from './utils';
import { Aruco } from '../../services/aruco';
import { H } from "../../services/helper";
import { math as M } from "../../services/math";

export class Actuators {

  private bolt: Bolt;

  private actions = {
    ping:               { device: C.Device.apiProcessor,  command: C.CMD.Api.ping,                                  data: [] as TNum },
    wake:               { device: C.Device.powerInfo,     command: C.CMD.Power.wake,                                data: [] as TNum },
    sleep:              { device: C.Device.powerInfo,     command: C.CMD.Power.sleep,                               data: [] as TNum },
    hibernate:          { device: C.Device.powerInfo,     command: C.CMD.Power.deepSleep,                           data: [] as TNum },
    calibrateCompass:   { device: C.Device.sensor,        command: C.CMD.Sensor.calibrateToNorth,   target: 0x12,   data: [] as TNum },
    resetLocator:       { device: C.Device.sensor,        command: C.CMD.Sensor.resetLocator,       target: 0x12,   data: [] as TNum },
    stabilize:          { device: C.Device.driving,       command: C.CMD.Driving.stabilization,     target: 0x12,   data: [ /* index */] as TNum },
    resetYaw:           { device: C.Device.driving,       command: C.CMD.Driving.resetYaw,          target: 0x12,   data: [] as TNum },
    roll:               { device: C.Device.driving,       command: C.CMD.Driving.driveWithHeading,  target: 0x12,   data: [ /* speed, (heading >> 8) & 0xff, heading & 0xff, flags */] as TNum },
    rotateMatrix:       { device: C.Device.userIO,        command: C.CMD.IO.matrixRotation,         target: 0x12,   data: [ /* 0|1|2|3 */] as TNum },
    matrixColor:        { device: C.Device.userIO,        command: C.CMD.IO.matrixColor,            target: 0x12,   data: [ /* r, g, b */] as TNum },
    infrared:           { device: C.Device.sensor,        command: 42,                              target: 0x12,   data: [ /* c, f, l, r, b */] as TNum },
  } as any;

  constructor(bolt: Bolt) {
    this.bolt = bolt;
  }

  async queue(name: string, overwrites: any = {}) {
    const message = Object.assign({ name }, this.actions[name], overwrites);
    return await this.bolt.queue.queueMessage(message);
  }


  // - - - - - ACTUATORS - - - - //

  /*
  // https://sdk.sphero.com/docs/sdk_documentation/sensor#send-infrared-message
  // https://sdk.sphero.com/docs/sdk_documentation/sensor#get-bot-to-bot-infrared-readings

    @staticmethod
    def send_robot_to_robot_infrared_message(toy, s, s2, s3, s4, s5, proc=None):  # Untested / Unknown param names
        toy._execute(Sensor._encode(toy, 42, proc, [s, s2, s3, s4, s5]))

    @staticmethod
    def listen_for_robot_to_robot_infrared_message(toy, s, j, proc=None):  # Untested / Unknown param names
        toy._execute(Sensor._encode(toy, 43, proc, [s, j]))

    robot_to_robot_infrared_message_received_notify = (24, 44, 0xff), lambda listener, p: listener(p.data[0])

      @staticmethod
    def enable_robot_infrared_message_notify(toy, enable, proc=None):
        toy._execute(Sensor._encode(toy, 62, proc, [int(enable)]))

    @staticmethod
    def send_infrared_message(toy, infrared_code, front_strength, left_strength, right_strength, rear_strength,
                              proc=None):
        toy._execute(Sensor._encode(
            toy, 63, proc, [infrared_code, front_strength, left_strength, right_strength, rear_strength]))

*/

  // - - - - - BASIC - - - - //

  async wake() { return await this.queue('wake') }
  async sleep() { return await this.queue('sleep') }
  async hibernate() { return await this.queue('hibernate') }
  async resetYaw() { return await this.queue('resetYaw') }  // /* Sets the current orientation as orientation 0??, use only after calibrate compass */
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
      // .then(data => { console.log('ping', data); })
    ;
  }


  // - - - - - INFRARED - - - - //

  async sendSignal() {


    for (const i of H.range(10)) {
      await this.queue('infrared', { data: [0, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [1, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [2, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [3, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [4, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [5, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [6, 255, 255, 255, 255] });
      await this.queue('infrared', { data: [7, 255, 255, 255, 255] });
      await wait(1000)

    }

  }

  async send() {
    await this.queue('infrared', { data: [0, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [1, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [2, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [3, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [4, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [5, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [6, 255, 255, 255, 255] });
    await this.queue('infrared', { data: [7, 255, 255, 255, 255] });
    return Promise.resolve(true).then(data => { console.log('send', data); });
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
          timeout  = window.setTimeout(finish, msecs);

        });
      }
    }

  }



  async stop() {
    // await this.disableSensors();
    return await this.roll(0, this.bolt.status.heading);
  }

  async roll(speed: number, heading: number, flags: TNum = []) {
    this.bolt.heading = heading;
    return await this
      .queue('roll', { data: [speed, (this.bolt.heading >> 8) & 0xff, this.bolt.heading & 0xff, flags] })
    ;
  }

  async rotate(degrees = 0) {
    return await this.roll(0, this.bolt.heading + degrees);
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

    for (const heading of range) {
      await this.roll(0, heading);
    }

    return await wait(200);

  }

  async rollUntil(speed: number, heading: number, delimiter: any) {

    const action = async () => await this.roll(speed, heading);

    return delimiter
      .do(action)
      .then(async () => await this.stop())
    ;

  }

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

    console.log(this.bolt.name, 'rollToPoint.in :', this.bolt.status.position, '=>', target);

    return new Promise( async (resolve, reject) => {

      const fullStopListener = async () => {
        await this.bolt.receiver.off('fullstop',   fullStopListener);
        await this.bolt.receiver.off('sensordata', sensorListener);
        resolve('fullstop');
      };

      const sensorListener = async (event: IEvent) => {

        let speed: number, distance: number, heading: number;

        const location = {
          x: event.sensordata.locator.positionX,
          y: event.sensordata.locator.positionY,
        } as IPoint;
        distance = M.distance(target, location);  // Math.hypot(target.x - x, target.y - y);
        heading  = M.heading(location, target);   // Math.atan2(y - target.y, x - target.x) * -180 / Math.PI +270;
        heading  = M.mod(heading);                //(heading + 360) % 360;

        speed = (
          distance > 100 ? 100 :
          distance >  50 ?  50 :
          distance >  30 ?  30 :
          distance >  20 ?  20 :
          15
        );

        console.log(this.bolt.name, 'rollToPoint', 'speed', speed, 'distance', distance);

        if (distance > tolerance) {
          await this.roll(speed, heading);

        } else {
          console.log('rollToPoint.out:', this.bolt.status.position, '=>', target);
          await this.stop();
          await this.bolt.receiver.off('sensordata', sensorListener);
          await this.bolt.receiver.off('fullstop',   fullStopListener);
          resolve(distance);
          // console.log('rollToPoint.tck:', this.bolt.status.position, '=>', target, 'd', ~~distance, 'h', ~~heading);

        }

      };

      await this.bolt.receiver.on('sensordata', sensorListener);
      await this.bolt.receiver.on('fullstop',   fullStopListener);

    });

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

        const location = {
          x: event.sensordata.locator.positionX,
          y: event.sensordata.locator.positionY,
        }
        const velocity = {
          x: event.sensordata.locator.velocityX,
          y: event.sensordata.locator.velocityY,
        }

        heading = M.mod(M.heading(location, target))
        delta   = M.angleDistance(heading, this.bolt.heading);

        console.log(this.bolt.name, 'calibrate', this.bolt.heading, heading, delta);

      };


      await this.bolt.receiver.on('sensordata', sensorListener);
      await this.bolt.receiver.on('fullstop',   fullStopListener);

      target = p1;
      await this.rollToPoint(target, 5);
      await this.piroutte();

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

        const angle = e.sensordata.angle;
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
