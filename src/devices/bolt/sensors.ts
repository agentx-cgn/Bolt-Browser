import { CONSTANTS as C } from '../constants';
import { maskToRaw, flatSensorMask } from './utils';

import { Bolt } from './bolt';
import { Receiver } from './receiver';
import { TNum, IEvent, ISensorData } from './interfaces';

export class Sensors {

	private bolt:     Bolt;
	private receiver: Receiver;

	private sensors = {
    batteryVoltage:     { device: C.Device.powerInfo,     command: C.CMD.Power.batteryVoltage,      target: 0x11,   data: [] as TNum },
    batteryState:       { device: C.Device.powerInfo,     command: C.CMD.Power.batteryState,        target: 0x11,   data: [] as TNum },
    ambientLight:       { device: C.Device.sensor,        command: C.CMD.Sensor.ambientLight,       target: 0x12,   data: [] as TNum },

    // batteryPercentage: { device: C.Device.powerInfo, command: C.CMD.Power.get_battery_percentage,     target: 0x11, data: [] as TNum },

  } as any;

	constructor (bolt: Bolt) {
		this.bolt     = bolt;
		this.receiver = this.bolt.receiver;
		// this.activate();
	}

	async queue(name: string, overwrites: any = {}) {
    const message = Object.assign({ name }, this.sensors[name], overwrites);
    return await this.bolt.queue.queueMessage(message);
  }

	/** TODOs
	 *
	 *  deal with sensor drift
	 *  deal with swapping North and South
	 *
	 */

	activate() {

	}

// EDU: current firmware versions 4.2.41, 4.2.44

// night, ceiling light: [0, 65, 64, 82, 18], [0, 65, 66, 43, 241], [0, 65, 64, 82, 18]
// battery max 164, min: 1.01

// 	* An 8-bit value is returned for each infrared sensor, assigned by mask.
// 	Mask description on BOLT: 32'h0000_00ff: front left sensor 32'h0000_ff00: front right sensor 32'h00ff_0000: back right sensor 32'hff00_0000: back left sensor
// 	* @returns Promise that resolves with the response from RVR for given command
// 	*/
//  getBotToBotInfraredReadings(): Promise<string | never>;
//  /**

async info() {
	// await this.batteryVoltage();
	// await this.ambientLight();
	// await this.batteryPercentage(); bad command ID
	// await this.getInfo(C.CMD.SystemInfo.mainApplicationVersion);
	// await this.getInfo(C.CMD.SystemInfo.bootloaderVersion);
	// await this.getBTName(17, 0x19, 0x04);
	// await this.getBTAdName(17, 0x19, 0x05);
}


  // "Will Sleep Notify", "0x13", "0x19"),
  // "Did Sleep Notify", "0x13", "0x1A"),
  // "Battery Voltage State Change Notify", "0x13", "0x1C"),
  // "Charger State Changed Notify", "0x13", "0x21"),
  // "Sensor Streaming Data Notify", "0x18", "0x02"),
  // "Gyro Max Notify", "0x18", "0x10"),
  // "Collision Detected Notify", "0x18", "0x12"),
  // "Magnetometer North Yaw Notify", "0x18", "0x26"),
  // "Robot To Robot Infrared Message Received Notify", "0x18", "0x2C"),
  // "Set Compressed Frame Player Text Scrolling Notify", "0x1A", "0x3C"),
  // "Compressed Frame Player Animation Complete Notify", "0x1A", "0x3F"),




  async disableSensors() {
    this.bolt.status.sensors = {};
    var mask = [C.SensorMaskValues.off];
    this.bolt.status.rawMask = maskToRaw(mask);
    await this.sensorMask(flatSensorMask(this.bolt.status.rawMask.aol), 0);
    // await this.sensorMaskExtended(flatSensorMask(this.bolt.status.rawMask.gyro));
    console.log(this.bolt.name, 'sensor.off');
    return Promise.resolve(true);
  }
  async enableSensors(interval: number, mask: number[]) {
    this.bolt.status.rawMask = maskToRaw(mask);
    await this.sensorMask(flatSensorMask(this.bolt.status.rawMask.aol), interval);
    // await this.sensorMaskExtended(flatSensorMask(this.bolt.status.rawMask.gyro));
    console.log(this.bolt.name, 'sensor.on');
    return Promise.resolve(true);
  }
  async enableSensorsAll(interval = 2000) {
    this.bolt.status.sensors = {
      locator:     true,
      orientation: true,
      interval,
    };
    return await this.enableSensors(interval, [
      // C.SensorMaskValues.accelerometer,
      C.SensorMaskValues.orientation,
      C.SensorMaskValues.locator,
      // C.SensorMaskValues.gyro,
    ]);

  }
  // async enableLocationEvent(interval = 1000) {
  //   return await this.enableSensors(interval, [C.SensorMaskValues.locator]);
  // }

  /* Sends sensors mask to Sphero (acceleremoter, orientation and locator) */
  // https://github.com/Tineyo/BoltAPP/blob/2662d790cbd66eea008af0484aa5a1bd5b720172/scripts/sphero/spheroBolt.js#L170
  async sensorMask(rawValue: number, interval: number) {
    return await this.bolt.queue.queueMessage({
      name: 'sensorMask',
      device: C.Device.sensor,
      command: C.CMD.Sensor.sensorMask, // SensorCommandIds.sensorMask,
      target: 0x12,
      data: [(
        interval >> 8) & 0xff,
      interval & 0xff,
        0,
      (rawValue >> 24) & 0xff,
      (rawValue >> 16) & 0xff,
      (rawValue >> 8) & 0xff,
      rawValue & 0xff,
      ],
    });
  }

  /* Sends sensors mask to Sphero (gyroscope) */
  async sensorMaskExtended(rawValue: any) {
    return await this.bolt.queue.queueMessage({
      name: 'sensorMaskExtended',
      device: C.Device.sensor,
      command: C.CMD.Sensor.sensorMaskExtented, // SensorCommandIds.sensorMaskExtented,
      target: 0x12,
      data: [
        (rawValue >> 24) & 0xff,
        (rawValue >> 16) & 0xff,
        (rawValue >>  8) & 0xff,
        (rawValue >>  0) & 0xff,
      ],
    });
  }
  // - - - -  INFO

  // https://sdk.sphero.com/docs/sdk_documentation/system_info/
  async getInfo(what: number) {
    return await this.bolt.queue.queueMessage({
      name: 'getInfo-' + String(what),
      device: C.Device.systeminfo,
      // command:   C.CMD.systeminfo.mainApplicationVersion,
      command: what,
      target: 0x12,
      data: []
    });
  }

  async getAmbientLight() {
    return await this.bolt.queue.queueMessage({
      name:     'getAmbientLight',
      device:    C.Device.sensor,
      command:   C.CMD.Sensor.ambientLight,
      target:    0x12,
      data:      []
    });
  }


  async enableCollisionEvent(xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
    return await this.bolt.queue.queueMessage({
      name:    'enableCollisionEvent',
      device:  C.Device.sensor,
      command: C.CMD.Sensor.configureCollision, // SensorCommandIds.configureCollision,
      target:  0x12,
      data:   [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]
    });
  }

  async enableBatteryChangeEvent() {
    return await this.bolt.queue.queueMessage({
      name:      'enableBatteryChangeEvent',
      device:    C.Device.powerInfo,
      command:   C.CMD.Power.batteryChangeNotify,
      data: []
    });
  }
  async enableGyroMaxEvent() {
    return await this.bolt.queue.queueMessage({
      name:      'enableGyroMaxEvent',
      device:    C.Device.sensor,
      command:   C.CMD.Sensor.gyroMax,
      data: []
    });
  }



};
