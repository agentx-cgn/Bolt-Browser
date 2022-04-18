import m from "mithril";

import { CONSTANTS as C }  from './constants';
import { IStatus, IMagic, TColor, IEvent, IAction, ISensorData, IConfig } from "./interfaces";
import { wait } from './utils'

import { Aruco } from '../../services/aruco';
import { Receiver } from './receiver';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Scripter } from './scripter';
import { Logger } from '../../components/logger/logger';
import { Queue } from './queue';
import { H } from "../../services/helper";
import { Plotter } from "../../components/plotter/plotter";

export class Bolt {

  public name:       string;
  public config:     IConfig;

  public characs = new Map();
  public device:     BluetoothDevice;
  public queue:      Queue;
  public actuators:  Actuators;
  public sensors:    Sensors;
  public receiver:   Receiver;
  public scripter:   Scripter;

  public log: (IAction|any)[] = [];

  public magic: IMagic;

  private corpus = {
    wait:  { category: 'verb', host: () => this,           method: 'wait'  },
    sleep: { category: 'verb', host: () => this.actuators, method: 'sleep' },
    wake:  { category: 'verb', host: () => this.actuators, method: 'wake'  },
    ping:  { category: 'verb', host: () => this.actuators, method: 'ping'  },
    roll:  { category: 'verb', host: () => this.actuators, method: 'roll'  },
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
    stabilization:   NaN,
    voltage:         NaN,
    battery:         NaN,
    charger:         NaN,
    ambient:         [],
    infrared:        [],
    heading:        NaN,
    speed:          NaN,
    rawMask:         {},
    angles:          {},
    position:        {},
    velocity:        {},
    sensors:         {},
    matrix: {
      rotation:       0,
      image:         [],
    }
  };

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

  constructor (device: BluetoothDevice, config: IConfig) {

    // Bolts.connectBolt does reset, activate, autoaction
    // calibrate happens manually
    // after that actions are possible



    this.config    = config;
    this.magic     = config.magic;
    this.name      = device.name;
    this.device    = device;
    this.receiver  = new Receiver(this);
    this.queue     = new Queue(this);
    this.sensors   = new Sensors(this);
    this.actuators = new Actuators(this);
    this.scripter  = new Scripter(this, this.corpus);

  }

  get heading () { return this.status.heading; }
  set heading ( value: number ) { this.status.heading = (value + 360) % 360; m.redraw() }

  get execute () { return this.scripter.execute(); }

  // only in roll and calibrate
  get connected () { return this.device.gatt.connected }

  async wait (msecs: number) { return await wait(msecs); }

  async reset() {

    Logger.info(this, 'Reset');

    const colorBolt  = this.config.colors.matrix;
    const colorBlack = this.config.colors.black;
    const colorFront = this.config.colors.front;
    const colorBack  = this.config.colors.back;

    await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
    await this.actuators.ping();

    await this.actuators.wake();
    await this.actuators.stop();
    await this.sensors.disableSensors();
    await this.actuators.stabilizeFull();

    await this.actuators.setLedsColor(...colorFront, ...colorBack); // red = north

    await this.actuators.matrixColor(...colorBlack);
    await this.actuators.matrixFill(1, 1, 6, 6, ...colorBolt);
    await this.actuators.matrixFill(3, 3, 4, 4, ...colorBlack);

    await this.actuators.resetLocator();
    await wait(1000);

    console.log('%c' + this.name + ' reset.out', 'color: darkgreen; font-weight: 800')

  };

  async activate () {

    await this.sensors.info();
    await this.sensors.activate();

    // Simple Movement
    for (const [key, fn] of Object.entries(this.keymapSimpleCommands)) {
      this.receiver.on(key, fn);
    }

    // stop everything on SPACE
    this.receiver.on('key:space',    async (event: IEvent) => {
      Logger.info(this, 'Fullstop');
      this.receiver.fire('fullstop');
      await this.actuators.stop();
      await this.sensors.disableSensors();
      await this.actuators.blinkChar('S', 5);
    });

    // keep awake
    this.receiver.on('willsleep', async (event: IEvent) => {
      // console.log(this.name, 'onWillSleepAsync', 'keepAwake', this.status.keepAwake, event.msg);
      if (this.status.keepAwake) {
        await this.actuators.wake();
        await this.actuators.piroutte();
      }
    });

    // sensordata
    this.receiver.on('sensordata',  (event: IEvent) => {
      const data: ISensorData = event.sensordata;
      if (data.angles && data.locator) {
        this.status.angles       = data.angles;
        this.status.position.x   = data.locator.positionX;
        this.status.position.y   = data.locator.positionY;
        this.status.velocity.x   = data.locator.velocityX;
        this.status.velocity.y   = data.locator.velocityY;
        this.status.speed        = Math.hypot(data.locator.velocityX, data.locator.velocityY);
        Plotter.placeBolt(this.name, data.locator, this.config.colors.plot)
        Plotter.render(data.locator, this.config.colors.plot);

        m.redraw();
      } else console.log(this.name, 'sensordata.broken', event.sensordata);
    }, false);

    // collision
    this.receiver.on('collison',    (event: IEvent) => {
      this.actuators.matrixChar('!');
      console.log(this.name, 'onCollision.data', event);
    });

    // infrared
    this.receiver.on('infrared',    (event: IEvent) => {
      this.sensors.infraredState();
      console.log(this.name, 'onInfrared.data', JSON.stringify(event));
      this.sensors.eventInfrared(1);
    });

    // just notify
    this.receiver.on('sleep',       (event: IEvent) => console.log(this.name, 'sleep',       event.msg));
    this.receiver.on('charging',    (event: IEvent) => console.log(this.name, 'charging',    event.msg));
    this.receiver.on('notcharging', (event: IEvent) => console.log(this.name, 'notcharging', event.msg));

    this.actuators.send();


    console.log('%c' + this.name + ' activated', 'color: darkgreen; font-weight: 800')

    // await this.sensors.enableCollisionEvent();
    // await this.sensors.enableLocationEvent();

  }

  async autoaction () {
    // return await this.execute
    //   .roll(30, 0)
    //   .wait(1000)
    //   .roll(30, 90)
    //   .end
    // ;
  }

  async calibrate() {

    Logger.info(this, 'calibrating.in');

    await wait(500);
    await this.actuators.calibrateNorth();
    await this.actuators.resetLocator();
    await wait(500);

    await this.actuators.calibrateHeading();

    Logger.info(this, 'calibrating.out');

  }


  async shake () {
    await this.actuators.roll(1, this.status.heading);
  }

  // async enableEvents () {
  //   await this.sensors.enableCollisionEvent();
  //   await this.sensors.enableLocationEvent();
  // }



  async action () {

    await this.actuators.circleAround(20, 35);
    await this.actuators.rollToPoint({x:0,y:0});
  }

  async stress () {
    Logger.info(this, 'stress.in');
    await this.actuators.rollToPoint({x:0,y:0});
    await this.actuators.circleAround(20, 35);
    await this.actuators.rollToPoint({x:0,y:0});
    Logger.info(this, 'stress.out');
  }

  async ActionRollUntil () {
    await this.actuators.matrixChar('1');
    await this.actuators.rollUntil(25, this.status.heading,      this.actuators.timeDelimiter(8000));
    await this.actuators.matrixChar('2');
    await this.actuators.rollUntil(25, this.status.heading -180, this.actuators.timeDelimiter(8000));
    await this.actuators.matrixChar('3');
  }

  /**         STUFF          */

  async ActionX () {
    await this.actuators.rotateMatrix(C.FrameRotation.deg180);
    await this.actuators.setMatrixImage(0, 0, 0, 200, 200, 200, Aruco.createImage(0));
    await this.actuators.rotate(90);
    await this.actuators.matrixColor(100, 100, 100);
    await this.actuators.matrixChar('#');
    // await this.actuators.batteryVoltage();
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
