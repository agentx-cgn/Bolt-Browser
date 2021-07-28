import m from "mithril";

import { CONSTANTS as C }  from '../constants';
// import { IAction, ICmdMessage } from './interfaces'
import { wait } from './utils'
import { Aruco } from '../../services/aruco';
import { Receiver } from './receiver';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue } from './queue';

export class Bolt { 

  public name:       string;

  public characs = new Map();
  public device:     BluetoothDevice;
  public queue:      Queue;
  public actuators:  Actuators;
  public sensors:    Sensors;
  public receiver:   Receiver;
  
  private counter:     number = 0;

  public status = {
    keepAwake:  true,
    heading:    0,
    rawMask:    NaN,
    position:   {} as any,
    velocity:   {} as any,
    matrix:     {
      rotation: 0,
      image:    [] as number[][],
    }
  } as any;

  constructor (device: BluetoothDevice) {
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

  async awake(){

    await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);

    await this.actuators.wake();	
    await this.actuators.setLedsColor(20, 0, 0, 10, 10, 10);
    await this.actuators.setMatrixColor(10, 10, 10);
    await wait(1000);

    await this.actuators.calibrateCompass();
    await wait(2000);
    
    await this.actuators.resetLocator();
    await wait(100);
    
    await this.actuators.batteryStatus();
    await wait(100);
    
    await this.actuators.setMatrixImage(0, 0, 0, 200, 200, 200, Aruco.createImage(0));
    
    // await this.actuators.rotate(90);
    // await this.actuators.setMatrixColor(100, 100, 100);
    // await this.actuators.printChar('#', 10, 40, 10);
    
  };

  async shake () {
    this.actuators.roll(1, this.status.heading, 0);
  }


  
  async reset () {
    await this.actuators.resetLocator();
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

  async info () {
    await this.actuators.getInfo(C.Cmds.systeminfo.mainApplicationVersion);
    await this.actuators.getInfo(C.Cmds.systeminfo.bootloaderVersion);
    await this.actuators.batteryStatus();
  }

  async config () {
    await this.actuators.configureCollisionDetection();
    await this.actuators.configureSensorStream();
  }

  
  action () {
    (async () => {

      const image = Aruco.createImage(0); // 73

      this.actuators.setMatrixImage(0, 0, 0, 255, 255, 0, image);
      await wait(1000);

      this.actuators.rotateMatrix(C.FrameRotation.deg180);
      
    })();
  }

}