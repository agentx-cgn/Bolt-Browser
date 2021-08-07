import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { IStatus, TColor, IEvent, IAction, ISensorData } from "./interfaces";
import { wait } from './utils'

import { Aruco } from '../../services/aruco';
import { Receiver } from './receiver';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue } from './queue';
import { H } from "../../services/helper";
import { Plotter } from "../../components/plotter";

export class Bolt {

  public name:       string;
  public config:     any;

  public characs = new Map();
  public device:     BluetoothDevice;
  public queue:      Queue;
  public actuators:  Actuators;
  public sensors:    Sensors;
  public receiver:   Receiver;

  public log: (IAction|any)[] = [];

  public magic = {
    rollInterval:   1000,
    sensorInterval: 250,

  };

  // simple
  private keymapSimpleCommands = {
    'key:esc':   (event: IEvent) => { console.log('key:esc');                                          },
    'key:up':    (event: IEvent) => { this.actuators.roll(25, this.heading) },
    'key:down':  (event: IEvent) => { this.actuators.roll(25, this.heading -180)},
    'key:left':  (event: IEvent) => { this.actuators.rotate(-30) },
    'key:right': (event: IEvent) => { this.actuators.rotate(+30) },
  }

  public status: IStatus = {
    rssi:            NaN,
    txPower:         NaN,
    keepAwake:       true,
    heading:          0,
    rawMask:          0,
    stabilization:   NaN,
    ambient:         [],
    sensors:         {},
    angles:          {},
    position:        {},
    velocity:        {},
    voltage:         [],   // seen [0, 1, 124]
    percentage:      [],   // seen [0, 1, 124]
    matrix: {
      rotation:       0,
      image:         [],
    }
  };

  constructor (device: BluetoothDevice, config: any) {

    this.config    = config;
    this.name      = device.name;
    this.device    = device;
    this.receiver  = new Receiver(this);
    this.queue     = new Queue(this);
    this.sensors   = new Sensors(this);
    this.actuators = new Actuators(this);

    // Plotter.register(this);

    // bolt get activated from Bolts after connected

    /**
      States:
        disconnected (connect) => connected (reset) => ready
                                                              (action)   =>  inAction    (reset) => ready
                                                              (sequence) =>  inSequence  (reset) => ready

        reset:
          calibrate
          resetYaw
          heading 0
          rotate 0
          matrix
          lights

          ready   accept key downs, collision, sensors
          ALWAYS  accept space for reset
     *
     */


  }

  get heading () { return this.status.heading; }

  // only in roll and calibrate
  set heading ( value: number ) { this.status.heading = (value + 360) % 360; m.redraw() }
  get connected () { return this.device.gatt.connected }

  async activate () {

    this.sensors.activate();

    // Simple Movement
    for (const [key, fn] of Object.entries(this.keymapSimpleCommands)) {
      this.receiver.on(key, fn);
    }

    // stop everything on SPACE
    this.receiver.on('key:space',    async (event: IEvent) => {
      console.log(this.name, 'fullstop');
      this.receiver.fire('fullstop', {});
      await this.actuators.stop();
      await this.sensors.disableSensors();
      await this.actuators.blinkChar('S', 5);
    });

    // keep awake
    this.receiver.on('willsleep', async (event: IEvent) => {
      console.log(this.name, 'onWillSleepAsync', 'keepAwake', this.status.keepAwake, event.msg);
      if (this.status.keepAwake) {
        await this.actuators.wake();
        await this.actuators.piroutte();
      }
    });

    // sensordata
    this.receiver.on('sensordata',  (event: IEvent) => {
      const data: ISensorData     = event.sensordata;
      this.status.angles     = data.angles;
      this.status.position.x = data.locator.positionX;
      this.status.position.y = data.locator.positionY;
      this.status.velocity.x = data.locator.velocityX;
      this.status.velocity.y = data.locator.velocityY;
      Plotter.render(this, data.locator);
      m.redraw();
      // console.log(this.name, 'sensordata', event.sensordata);
    }, false);

    // collision
    this.receiver.on('collison',    (event: IEvent) => {
      this.actuators.printChar('!');
      console.log(this.name, 'onCollision.data', event);
    });

    // just notify
    this.receiver.on('sleep',       (event: IEvent) => console.log(this.name, 'sleep',       event.msg));
    this.receiver.on('charging',    (event: IEvent) => console.log(this.name, 'charging',    event.msg));
    this.receiver.on('notcharging', (event: IEvent) => console.log(this.name, 'notcharging', event.msg));

    // await this.sensors.enableCollisionEvent();
    // await this.sensors.enableLocationEvent();

  }

  async fullstop() {  }


  async reset() {

    await this.actuators.ping();

    this.receiver.logs = { sensor: [] };

    const colorBolt:  TColor = this.config.colors.matrix;
    const colorFront: TColor = [10, 0, 0];
    const colorBack:  TColor = [ 5, 5, 5];

    await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);

    await this.actuators.wake();
    await this.actuators.stop();
    await this.sensors.disableSensors();
    await this.actuators.stabilizeFull();
    await this.actuators.setLedsColor(...colorFront, ...colorBack); // red = north
    await this.actuators.setMatrixColor(...colorBolt);
    // await this.actuators.info();
    await this.actuators.calibrateNorth();
    await wait(4000);

    await this.actuators.resetLocator();
    await wait(1000);

  };

  async shake () {
    await this.actuators.roll(1, this.status.heading);
  }

  // async enableEvents () {
  //   await this.sensors.enableCollisionEvent();
  //   await this.sensors.enableLocationEvent();
  // }

  async action () {
    await this.actuators.printChar('0');
    await this.actuators.rollToPoint({x:   0, y:  40});
    await this.actuators.printChar('1');
    await this.actuators.rollToPoint({x:  40, y:  40});
    await this.actuators.printChar('2');
    await this.actuators.rollToPoint({x:  40, y:   0});
    await this.actuators.printChar('3');
    await this.actuators.rollToPoint({x:   0, y:   0});
    await this.actuators.printChar('4');
    await this.actuators.roll(0, 0);
  }

  async ActionRollUntil () {
    await this.actuators.printChar('1');
    await this.actuators.rollUntil(25, this.status.heading,      this.actuators.timeDelimiter(8000));
    await this.actuators.printChar('2');
    await this.actuators.rollUntil(25, this.status.heading -180, this.actuators.timeDelimiter(8000));
    await this.actuators.printChar('3');
  }

  /**         STUFF          */

  async ActionX () {
    await this.actuators.rotateMatrix(C.FrameRotation.deg180);
    await this.actuators.setMatrixImage(0, 0, 0, 200, 200, 200, Aruco.createImage(0));
    await this.actuators.rotate(90);
    await this.actuators.setMatrixColor(100, 100, 100);
    await this.actuators.printChar('#');
    await this.actuators.batteryVoltage();
    await this.actuators.resetLocator();
    await this.actuators.calibrateCompass();
    await this.actuators.resetYaw();
    await this.actuators.rotate(90);
    await wait(300);
    await this.actuators.rotate(180);
    await wait(300);
    await this.actuators.rotate(270);
    await wait(300);
    await this.actuators.rotate(0);
    await wait(300);
  }

}
