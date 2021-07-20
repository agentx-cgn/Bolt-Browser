
import { CONSTANTS as C }  from '../../globals/constants';
// import { Bluetooth as BT }  from '../../services/bluetooth.service';
import { Actuators } from './actuators';

export class Bolt { 

  public name:any;
  public characs = new Map();
  public device:any;

  private connected:boolean;
  private actuators;

  constructor (device: BluetoothDevice) {
    this.name      = device.name;
    this.device    = device;
    this.actuators = new Actuators(this);
	}

  append () {}

  async awake(){
    const color = Math.round(0xffffff * Math.random());
    const r = color >> 16, g = color >> 8 & 255, b = color & 255;

		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
		this.connected = true;
		this.actuators.wake();	
		// this.resetYaw();
		this.actuators.resetLocator();	
    this.actuators.setLedsColor(2, 4, 2);
		this.actuators.setMatrixColor(r, g, b);
		this.actuators.calibrateToNorth();
		this.actuators.printChar('K', 10, 40, 10);
	};

  onCharacteristicValueChanged (event: any) {

    const tgt = event.currentTarget;
    const mesg = {
      uuid: tgt.uuid,
      value: JSON.stringify(tgt.value),
    }
    // console.log(this.name, 'onCharacteristicValueChanged', mesg);
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

// export const Bolts = new bolts(BT);