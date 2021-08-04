import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { IStatus, TColor, IEvent } from "./interfaces";
import { wait } from './utils'

import { Aruco } from '../../services/aruco';
import { Receiver } from './receiver';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue } from './queue';
import { H } from "../../services/helper";

export class Bolt {

  public name:       string;
  public config:     any;

  public characs = new Map();
  public device:     BluetoothDevice;
  public queue:      Queue;
  public actuators:  Actuators;
  public sensors:    Sensors;
  public receiver:   Receiver;

  public magic = {
    rollInterval: 1000,

  };

  private keymap = {
    'key:space': (event: IEvent) => { this.reset()},
    'key:esc':   (event: IEvent) => {},
    'key:up':    (event: IEvent) => { this.actuators.roll(25, this.heading) },
    'key:down':  (event: IEvent) => { this.actuators.roll(25, this.heading -180)},
    'key:left':  (event: IEvent) => { this.actuators.rotate(-30) },
    'key:right': (event: IEvent) => { this.actuators.rotate(+30) },
  }

  public status: IStatus = {
    keepAwake:       true,
    heading:          0,
    rawMask:          0,
    stabilization:   NaN,
    ambient:         [],
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
  set heading ( value: number ) { this.status.heading = (value + 360) % 360; m.redraw() }
  get connected () { return this.device.gatt.connected }

  activate () {

    // keys
    for (const [key, fn] of Object.entries(this.keymap)) {
      this.receiver.on(key, fn);
    }

    // keep awake
    this.receiver.on('willsleep', async (event: IEvent) => {
			console.log(this.name, 'onWillSleepAsync', 'keepAwake', this.status.keepAwake, event.msg);
			if (this.status.keepAwake) {
				await this.actuators.wake();
				await this.actuators.piroutte();
			}
		});

    // collision
		this.receiver.on('collison',    (event: IEvent) => {
      this.actuators.printChar('!');
			console.log(this.name, 'onCollision.data', event.msg.data.join(' '));
		});

    // just notify
		this.receiver.on('sleep',       (event: IEvent) => console.log(this.name, 'sleep',       event.msg));
		this.receiver.on('charging',    (event: IEvent) => console.log(this.name, 'charging',    event.msg));
		this.receiver.on('notcharging', (event: IEvent) => console.log(this.name, 'notcharging', event.msg));

  }

  async reset() {

    this.receiver.logs = { sensor: [] };

    const colorBolt:  TColor = this.config.colors.matrix;
    const colorFront: TColor = [10, 0, 0];
    const colorBack:  TColor = [ 5, 5, 5];

    await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);

    await this.actuators.wake();
    await this.actuators.stop();
    await this.actuators.stabilizeFull();
    await this.actuators.disableSensors();
    await this.actuators.setLedsColor(...colorFront, ...colorBack); // red = north
    await this.actuators.setMatrixColor(...colorBolt);
    await this.actuators.info();
    await this.actuators.calibrateNorth();
    await wait(4000);

    await this.actuators.resetLocator();
    await wait(1000);

  };

  async shake () {
    await this.actuators.roll(1, this.status.heading);
  }

  async configure () {
    await this.actuators.enableCollisionDetection();
    await this.actuators.enableSensorsLocation();
  }

  async action () {
    await this.actuators.printChar('0');
    await this.actuators.rollToPoint({x: 50, y: 50});
    await this.actuators.printChar('1');
    await this.actuators.rollToPoint({x:  0, y:  0});
    await this.actuators.printChar('2');
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
