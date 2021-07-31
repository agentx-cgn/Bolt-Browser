import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { IStatus, TColor } from "./interfaces";
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
  
  public status: IStatus = {
    keepAwake:  true,
    heading:    0,
    rawMask:    0,
    ambient:    [],
    position:   {},
    velocity:   {},
    voltage:    [],   // seen [0, 1, 124]
    percentage: [],   // seen [0, 1, 124]
    matrix:     {
      rotation: 0,
      image:    [],
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
  }

  get heading () { return this.status.heading; }
  set heading ( value: number ) { this.status.heading = value; m.redraw() }
  get connected () { return this.device.gatt.connected }

  async reset() {

    const color: TColor = this.config.colors.matrix;

    await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);

    await this.actuators.wake();	
    await this.actuators.setLedsColor(10, 0, 0, 5, 5, 5); // red = north
    await this.actuators.info();	
    await this.actuators.setMatrixColor(...color);
    await this.actuators.calibrateNorth();
    await wait(4000);
    
    await this.actuators.resetLocator();
    await wait(1000);
    
  };
  
  async shake () {
    this.actuators.roll(1, this.status.heading, 0);
  }
  
  async configure () {
    await this.actuators.enableCollisionDetection();
    await this.actuators.enableSensorStream();
  }
  
  
  async action () {

    await this.actuators.rollUntil(16, 0, this.actuators.timeDelimiter(4000))

  }
    
    
    async ActionX () {
    await this.actuators.rotateMatrix(C.FrameRotation.deg180);
    await this.actuators.setMatrixImage(0, 0, 0, 200, 200, 200, Aruco.createImage(0));
    await this.actuators.rotate(90);
    await this.actuators.setMatrixColor(100, 100, 100);
    await this.actuators.printChar('#', 10, 40, 10);
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