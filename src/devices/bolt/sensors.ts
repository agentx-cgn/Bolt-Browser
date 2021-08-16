import { CONSTANTS as C } from './constants';
import { maskToRaw, flatSensorMask } from './utils';

import { Bolt } from './bolt';
import { Receiver } from './receiver';
import { TNum, IEvent, ISensorData } from './interfaces';
import { Logger } from '../../components/logger/logger';

export class Sensors {

	private bolt:     Bolt;
	private receiver: Receiver;

  // power  = 19, // 0x13
  // sensor = 24, // 0x18

	private sensors = {
    batteryVoltage:     { device: C.Device.powerInfo,     command: C.CMD.Power.batteryVoltage,       target: 0x11,   data: [] as TNum },
    batteryState:       { device: C.Device.powerInfo,     command: C.CMD.Power.batteryVoltageState,  target: 0x11,   data: [] as TNum },
    chargerState:       { device: C.Device.powerInfo,     command: C.CMD.Power.chargerState,         target: 0x11,   data: [] as TNum },
    ambientLight:       { device: C.Device.sensor,        command: C.CMD.Sensor.ambientLight,        target: 0x12,   data: [] as TNum },

    // batteryPercentage: { device: C.Device.powerInfo, command: C.CMD.Power.get_battery_percentage,     target: 0x11, data: [] as TNum },

  } as any;

	constructor (bolt: Bolt) {
		this.bolt     = bolt;
		this.receiver = this.bolt.receiver;
	}

	async queue(name: string, overwrites: any = {}) {
    const message = Object.assign({ name }, this.sensors[name], overwrites);
    return await this.bolt.queue.queueMessage(message);
  }

	async activate() {
    Logger.info(this.bolt, 'Sensors.activate');
    await this.enableCollisionEvent();
    await this.enableGyroEvent();
    await this.enableChargerEvent();
    await this.enableBatteryEvent();
    await this.enableInfraredEvent(4);  // bad data length
    return Promise.resolve(true);
  }

  async enableCollisionEvent(xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
    return await this.bolt.queue.queueMessage({
      name:    'enableCollisionEvent',
      device:  C.Device.sensor,
      command: C.CMD.Sensor.collisionEvent, // SensorCommandIds.configureCollision,
      target:  0x12,
      data:   [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]
    });
  }
  async disableCollisionEvent() {
    return await this.bolt.queue.queueMessage({
      name:    'enableCollisionEvent',
      device:  C.Device.sensor,
      command: 0x14, //C.CMD.Sensor.collisionEvent, // SensorCommandIds.configureCollision,
      target:  0x12,
      data:   [0]
    });
  }

  async enableBatteryEvent() {
    return await this.bolt.queue.queueMessage({
      name:      'enableBatteryEvent',
      device:    C.Device.powerInfo,
      command:   C.CMD.Power.batteryEvent,
      target:    0x11,
      data: [1]
    });
  }
  async enableChargerEvent() {
    return await this.bolt.queue.queueMessage({
      name:      'enableChargerEvent',
      device:    C.Device.powerInfo,
      command:   0x20, //C.CMD.Power.chargerEvent,
      target:    0x11,
      data: [1]
    });
  }
  async enableGyroEvent() {
    return await this.bolt.queue.queueMessage({
      name:      'enableGyroEvent',
      device:    C.Device.sensor,
      command:   0x0F, // C.CMD.Sensor.gyroEvent,
      target:    0x12,
      data: [1]
    });
  }
  async disbaleGyroEvent() {
    return await this.bolt.queue.queueMessage({
      name:      'enableGyroEvent',
      device:    C.Device.sensor,
      command:   0x0F, // C.CMD.Sensor.gyroEvent,
      target:    0x12,
      data: [0]
    });
  }
  async enableInfraredEvent(channel: number) {
    return await this.bolt.queue.queueMessage({
      name:      'enableInfraredEvent',
      device:    C.Device.sensor,
      command:   0x2B, //C.CMD.Sensor.infraredListenEvent,
      target:    0x12,
      data:     [1, 2, 3, 4, 5]
    });
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
    Logger.info(this.bolt, 'Sensor.info');
    await this.batteryState();
    await this.chargerState();
    await this.batteryVoltage();
    await this.ambientLight();
    return Promise.resolve(true);
  }

  async batteryVoltage() {
    return await this
      .queue('batteryVoltage')
      .then(action => {
        let voltage = action.response[0] << 8;
        voltage    += action.response[1];
        console.log('batteryVoltage', action.response, voltage / 100);
      })
    ;
  }
  async batteryState() {
    return await this
      .queue('batteryState')
      .then(action => { console.log('batteryState', action.response); })
    ;
  }
  async chargerState() {
    return await this
      .queue('chargerState')
      .then(action => { console.log('chargerState', action.response); })
    ;
  }
  async ambientLight() {
    return await this
      .queue('ambientLight')
      .then(action => { console.log('ambientLight', action.response); })
      // .then(cmd => this.bolt.status.ambient = cmd.responseData.slice(-3).join(' '))
    ;
  }

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
  async enableSensorsAll(interval = 1000) {
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
  // async getInfo(what: number) {
  //   return await this.bolt.queue.queueMessage({
  //     name: 'getInfo-' + String(what),
  //     device: C.Device.systeminfo,
  //     // command:   C.CMD.systeminfo.mainApplicationVersion,
  //     command: what,
  //     target: 0x12,
  //     data: []
  //   });
  // }

  // async getAmbientLight() {
  //   return await this.bolt.queue.queueMessage({
  //     name:     'getAmbientLight',
  //     device:    C.Device.sensor,
  //     command:   C.CMD.Sensor.ambientLight,
  //     target:    0x12,
  //     data:      []
  //   });
  // }






};
