
import { CONSTANTS as C }  from '../../globals/constants';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue  } from './queue';
import { commandPushByte, bufferToHex, wait } from './utils'
import { ICmdMessage } from './interfaces'

export class Bolt { 

  public name:       string;
  public queue:      Queue;
  public device:     BluetoothDevice;
  public actuators:  Actuators;
  public sensors:    Sensors;
  private counter:   number = 0;
  
  public characs = new Map();
  private connected: boolean;

  constructor (device: BluetoothDevice) {
    this.name      = device.name;
    this.device    = device;
    this.queue     = new Queue();
    this.actuators = new Actuators(this);
    this.sensors   = new Sensors(this);
	}

  /* Packet encoder */
	createCommand( message: ICmdMessage ) {

		const { device, command, target, data } = message;
    const cmdflg = C.Flags.requestsResponse | C.Flags.resetsInactivityTimeout | (target ? C.Flags.commandHasTargetId : 0) ;
    const bytes  = [];	  
    let checkSum: number = 0;
    
    this.counter = (this.counter +1) % 255

    bytes.push(C.APIConstants.startOfPacket);

    bytes.push(cmdflg);
    checkSum += cmdflg;

    if (target){
      bytes.push(target);
      checkSum += target;
    }

    commandPushByte(bytes, device);
    checkSum += device;

    commandPushByte(bytes, command);
    checkSum += command;

    commandPushByte(bytes, this.counter);
    checkSum += this.counter;

    for( var i = 0 ; i < data.length ; i++ ){
      commandPushByte(bytes, data[i]);
      checkSum += data[i];
    }

    checkSum = (~checkSum) & 0xff;
    commandPushByte(bytes, checkSum);

    bytes.push(C.APIConstants.endOfPacket);

    return bytes;

	}

  async awake(){

		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
		this.actuators.wake();	

    this.sensors.configureCollisionDetection();
		
    // this.resetYaw();‚
		this.actuators.resetLocator();	
    this.actuators.setLedsColor(2, 4, 2);
		// this.actuators.setMatrixColor(r, g, b);
		this.actuators.setMatrixRandomColor();
		this.actuators.calibrateToNorth();
		this.actuators.printChar('K', 10, 40, 10);

	};

  async shake () {
    this.actuators.roll(1, this.sensors.heading, 0);
  }

  onCharacteristicValueChanged (event: any) {

    const tgt  = event.currentTarget;
    const val: DataView  = event.target.value;
    const buf: ArrayBuffer = val.buffer;
    const mesg = {
      uuid:  tgt.uuid,
      len:   event.target.value.byteLength,
      value: JSON.stringify(tgt.value),
    }
    // console.log(this.name, 'onCharacteristicValueChanged', tgt.uuid, mesg.len, JSON.stringify(tgt.value));
    console.log(this.name, 'onCharacteristicValueChanged', mesg.len, bufferToHex(buf));
  }

  onGattServerDisconnected (event: any) {

    const tgt = event.currentTarget;
    const mesg = {
      uuid:  tgt.uuid,
      value: JSON.stringify(tgt.value),
    }
    console.log(this.name, 'onGattServerDisconnected', tgt.name);

  }

  action () {
    (async () => {
      await this.actuators.setHeading(this.sensors.heading -180);
      await wait(1000);
      await this.actuators.setHeading(this.sensors.heading );
    })()
  }

}
