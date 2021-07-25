import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue  } from './queue';
import { commandPushByte, bufferToHex, wait, logDataView } from './utils'
import { IAction, ICmdMessage } from './interfaces'
import { Aruco } from '../../services/aruco';

export class Bolt { 

  public name:       string;

  public characs = new Map();
  public device:     BluetoothDevice;
  public queue:      Queue;
  public actuators:  Actuators;
  public sensors:    Sensors;
  
  private counter:     number = 0;

  public status = {
    connected: false,
    heading:   0,
    keepAwake: true,
  } as any;

  constructor (device: BluetoothDevice) {
    this.name      = device.name;
    this.device    = device;
    this.queue     = new Queue(this);
    this.actuators = new Actuators(this);
    this.sensors   = new Sensors(this);
	}

  get heading () { return this.status.heading; }
  set heading ( value: number ) { this.status.heading = value; m.redraw() }

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

  /* Put a command message on the queue */
  async queueMessage( message: ICmdMessage ): Promise<any> {

    return new Promise( (resolve, reject) => {

      const action: IAction = {
        name:         message.name,
        bolt:         this,
        command:      this.createCommand(message),
        charac:       this.characs.get(C.APIV2_CHARACTERISTIC), 
        acknowledged: false,
        executed:     false,
        onSuccess:    (command: any) => {
          action.acknowledged = true;
          resolve(command);
          m.redraw();
        },
        onError:      ( error: string ) => {
          console.log(error);
          action.acknowledged = true;
          reject(error);
          m.redraw();
        },
      }

      this.queue.append(action);

    });

  }


  async awake(){

    // await wait(1000);

		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
    // await wait(1000);

		await this.actuators.wake();	
    await this.actuators.setLedsColor(20, 0, 0, 10, 10, 10);
		// await this.actuators.setMatrixRandomColor();
		await this.actuators.setMatrixColor(10, 10, 10);
    await wait(1000);

    // await this.actuators.configureCollisionDetection();
    // await wait(1000);
		// await this.actuators.resetLocator();	
    // await wait(1000);
    // await wait(1000);

		await this.actuators.calibrateToNorth();
    await wait(2000);
    
    await this.actuators.rotate(90);
    await wait(100);
    await this.actuators.rotate(0);
    await wait(100);

    await this.actuators.setMatrixImage(0, 0, 0, 200, 200, 200, Aruco.createImage(0));

    // await this.actuators.setMatrixColor(100, 100, 100);
    // await wait(100);
		// await this.actuators.printChar('#', 10, 40, 10);
    
	};

  async shake () {
    this.actuators.roll(1, this.status.heading, 0);
  }
  
  onAdvertisementReceived  (event: any) {
    
    console.log('  Device Name: ' + event.device.name);
    console.log('  Device ID: '   + event.device.id);
    console.log('  RSSI: '        + event.rssi);
    console.log('  TX Power: '    + event.txPower);
    console.log('  UUIDs: '       + event.uuids);
    
    event.manufacturerData.forEach((valueDataView: DataView, key: string) => {
      logDataView('Manufacturer', key, valueDataView);
    });
    event.serviceData.forEach((valueDataView: DataView, key: string) => {
      logDataView('Service', key, valueDataView);
    });
    
  }

  
  // https://sdk.sphero.com/docs/sdk_documentation/system_info/
  getInfo (what: number) {
    this.queueMessage({
      name:      'getInfo', 
      device:    C.DeviceId.systemInfo,
      // command:   C.Cmds.systeminfo.mainApplicationVersion,
      command:   what,
      target:    0x12,
      data:      []
    });  
  }
  
  action () {
    (async () => {

      const image = Aruco.createImage(0); // 73

      this.actuators.setMatrixImage(0, 0, 0, 255, 255, 0, image);
      await wait(1000);

      this.actuators.rotateMatrix(C.FrameRotation.deg180);
      
    })();
  }
    
  onGattServerDisconnected (event: any) {
    console.log(this.name, 'onGattServerDisconnected', event);
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

}