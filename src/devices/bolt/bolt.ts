
import { CONSTANTS as C }  from '../../globals/constants';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue  } from './queue';

export class Bolt { 

  public name:       string;
  public queue:      Queue;
  public device:     BluetoothDevice;
  private actuators: Actuators;
  public sensors:    Sensors;
  
  public characs = new Map();
  private connected: boolean;

  constructor (device: BluetoothDevice) {
    this.name      = device.name;
    this.device    = device;
    this.actuators = new Actuators(this);
    this.sensors   = new Sensors(this);
    this.queue     = new Queue();
	}

  // append () {}

  async awake(){
    const color = Math.round(0xffffff * Math.random());
    const r = color >> 16, g = color >> 8 & 255, b = color & 255;

		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
		// this.connected = true;
		this.actuators.wake();	

    this.sensors.configureCollisionDetection();
		
    // this.resetYaw();‚
		this.actuators.resetLocator();	
    this.actuators.setLedsColor(2, 4, 2);
		this.actuators.setMatrixColor(r, g, b);
		this.actuators.calibrateToNorth();
		this.actuators.printChar('K', 10, 40, 10);


	};

  onCharacteristicValueChanged (event: any) {

    const tgt  = event.currentTarget;
    const mesg = {
      uuid: tgt.uuid,
      value: JSON.stringify(tgt.value),
    }
    console.log(this.name, 'onCharacteristicValueChanged', tgt.uuid, JSON.stringify(tgt.value));
  }

  onGattServerDisconnected (event: any) {

    const tgt = event.currentTarget;
    const mesg = {
      uuid: tgt.uuid,
      value: JSON.stringify(tgt.value),
    }
    console.log(this.name, 'onGattServerDisconnected', tgt.name);
  }

}
