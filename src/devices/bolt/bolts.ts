
import { CONSTANTS as C }  from '../../globals/constants';
import { Bluetooth as BT }  from '../../services/bluetooth.service';
import {
  commandPushByte
} from './utils';

class bolts {

  public map;
  private bolts: any = [];
  private callback: any;
  private bluetooth: any;

  constructor ( BT: any ) {
    this.bluetooth = BT;
    this.map = Array.prototype.map.bind(this.bolts);
    this.initialize();
	}

  async initialize () {

    const devices = await this.bluetooth.find('SB-');

    for ( let device of devices ){			  

      const bolt = new Bolt(device);
      const success = await this.initDevice(bolt, device);

      if (success) {
        await bolt.awake();
        this.bolts.push(bolt);
      }

    }

    console.log('Bolts.initialize', devices);

  }

  pair () {

    (async () => {

      const device = await this.bluetooth.pair('SB-');
      const bolt = new Bolt(device);
      const success = await this.initDevice(bolt, device);
  
      if (success) {
        await bolt.awake();
        this.bolts.push(bolt);
      }
  
    })()


  }

	async initDevice(bolt: Bolt, device: BluetoothDevice): Promise<boolean> {

    try {
      const server   = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      for ( let service of services ){			
        if (service.uuid === C.UUID_SPHERO_SERVICE){
          let characteristics = await service.getCharacteristics();
          for ( let charac of characteristics){
            if ( charac.uuid === C.APIV2_CHARACTERISTIC ){
              await this.mapCharacteristic(bolt, charac);
            }
          }
        }
        else if (service.uuid === C.UUID_SPHERO_SERVICE_INITIALIZE){
          let characteristics = await service.getCharacteristics();
          for (let charac of characteristics){
            if (charac.uuid === C.ANTIDOS_CHARACTERISTIC || 
            charac.uuid === C.DFU_CONTROL_CHARACTERISTIC || 
            charac.uuid === C.DFU_INFO_CHARACTERISTIC || 
            charac.uuid === C.SUBS_CHARACTERISTIC){
              await this.mapCharacteristic(bolt, charac);
            }
          }
        }
      }
    }
    catch (err) {
      console.log(device.name, err);
      return false;
    }

    return true;

	}

	async mapCharacteristic(bolt: Bolt, charac:any){

    if (charac.properties.notify){
      await charac.startNotifications();
    }
		bolt.characs.set(charac.uuid, charac);
    charac.addEventListener('characteristicvaluechanged', bolt.onCharacteristicValueChanged);

  }

  onUpdate (callback: any) {
    this.callback = callback;
  }

  register () {

  }

}

export const Bolts = new bolts(BT);

/* The objective of this queue is to send packets in turns to avoid GATT error */

class Queue {

  private running:any;
  private tasks: any[]
  private bolt:Bolt;

	constructor ( bolt: Bolt ) {
    this.bolt = bolt;
		this.running = false;
		this.tasks = [];
	}

	runCommand(data:any){
		this.running = true;
		this.bolt.write( data, () => {
			this.running = false;
			if (this.tasks.length > 0) {
				this.runCommand(this.tasks.shift());
			}
		})
	}

	enqueueCommand(data: any){
		this.tasks.push(data);
	}

	queue (data: any){
		!this.running ? this.runCommand(data) : this.enqueueCommand(data);
	}
}

export class Bolt { 
  private seqNumber = 0;

  private name:any;
  public characs = new Map();
  private device:any;
  private connected:boolean;
  // private characs:any;
  private queue;

  constructor (device: BluetoothDevice) {
    this.device = device;
    this.queue = new Queue(this);

	}

  async awake(){
		await this.characs.get(C.ANTIDOS_CHARACTERISTIC).writeValue(C.useTheForce);
		this.connected = true;
		this.wake();	
		// this.resetYaw();
		// this.resetLocator();	
		this.setAllLeds(255, 255, 255);
	};

  onCharacteristicValueChanged (...args: any) {
    console.log(this.name, 'onCharacteristicValueChanged', args);
  }

  /*  Write a command on a specific characteristic*/
	async write(data:any, callback:any){
		try{
			await data.charac.writeValue(new Uint8Array(data.command));
		}
		catch(error){
			console.log(error.message);	
		}
		if(callback){
			callback();
		}
	}

  	/* Packet encoder */
	createCommand(commandInfo:any) {

		const { deviceId, commandId, targetId, data } = commandInfo;
	  
    this.seqNumber = (this.seqNumber + 1) % 255;
	    var sum = 0;
	    var command = [];
	    command.push(C.APIConstants.startOfPacket);
	    var cmdflg = C.Flags.requestsResponse | C.Flags.resetsInactivityTimeout | (targetId ? C.Flags.commandHasTargetId : 0) ;
	    command.push(cmdflg);
	    sum += cmdflg;
	    if (targetId){
	    	command.push(targetId);
	    	sum+=targetId;
	    }
	    commandPushByte(command, deviceId);
	    sum += deviceId;
	    commandPushByte(command, commandId);
	    sum += commandId;
	    commandPushByte(command, this.seqNumber);
	    sum += this.seqNumber;
	    for( var i = 0 ; i < data.length ; i++ ){
	        commandPushByte(command, data[i]);
	        sum += data[i];
	    }
	    var chk = (~sum) & 0xff;
	    commandPushByte(command, chk);
	    command.push(C.APIConstants.endOfPacket);
	    return command;
	}
	
	/* Put a command on the queue */
	queueCommand(command:any){
		this.queue.queue({charac: this.characs.get(C.APIV2_CHARACTERISTIC), command: command});
	}
  	/* Waking up Sphero */
	wake(){
		let commandInfo = {
			deviceId: C.DeviceId.powerInfo,
			commandId: C.Cmds.power.wake, // PowerCommandIds.wake,
			data: [] as any[],
		}
		let command = this.createCommand(commandInfo);
		this.queueCommand(command);
	}

  setAllLeds(r:any, g:any, b:any){
		this.setLedsColor(r, g, b);
		this.setMatrixColor(r, g, b);
	}

  setLedsColor(r:any, g:any, b:any){
		let commandInfo = {
			deviceId: C.DeviceId.userIO,
			commandId: C.Cmds.io.allLEDs,
			data: [0x3f, r, g, b, r, g, b],
		};
		let command = this.createCommand(commandInfo);
		this.queueCommand(command);
	}

  setMatrixColor(r:any, g:any, b:any){
		let commandInfo = {
			deviceId: C.DeviceId.userIO,
			commandId: C.Cmds.io.matrixColor, // UserIOCommandIds.matrixColor,
			targetId: 0x12,
			data: [r, g, b], 
		}
		let command = this.createCommand(commandInfo);
		this.queueCommand(command);
	}

}

