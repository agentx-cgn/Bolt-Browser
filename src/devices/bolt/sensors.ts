import { CONSTANTS as C } from './constants';
import { maskToRaw, flatSensorMask } from './utils';
import { Bolt } from './bolt';
import { TNum, TOnOff, IEvent, ISensorData } from './interfaces';
import { Logger } from '../../components/logger/logger';


// https://sdk.sphero.com/docs/sdk_documentation/sensor/
// https://sdk.sphero.com/docs/sdk_documentation/power/

export class Sensors {

  public name = 'Sensors';

	private bolt:     Bolt;

	private sensors = {

    batteryVoltage:     { device: C.Device.powerInfo,     command: C.CMD.Power.batteryVoltage,       target: 0x11,   data: [] as TNum },
    batteryState:       { device: C.Device.powerInfo,     command: C.CMD.Power.batteryVoltageState,  target: 0x11,   data: [] as TNum },
    chargerState:       { device: C.Device.powerInfo,     command: C.CMD.Power.chargerState,         target: 0x11,   data: [] as TNum },
    eventBattery:       { device: C.Device.powerInfo,     command: C.CMD.Power.eventBattery,         target: 0x11,   data: [ /* 0|1 */ ] as TNum },
    eventCharger:       { device: C.Device.powerInfo,     command: C.CMD.Power.eventCharger,         target: 0x11,   data: [ /* 0|1 */ ] as TNum },

    ambientLight:       { device: C.Device.sensor,        command: C.CMD.Sensor.ambientLight,        target: 0x12,   data: [ /* ... */ ] as TNum },
    eventGyro:          { device: C.Device.sensor,        command: C.CMD.Sensor.eventGyro,           target: 0x12,   data: [] as TNum },
    eventInfrared:      { device: C.Device.sensor,        command: C.CMD.Sensor.eventInfrared,       target: 0x12,   data: [ /* ... */ ] as TNum },
    eventCollision:     { device: C.Device.sensor,        command: C.CMD.Sensor.eventCollision,      target: 0x12,   data: [ /* ... */ ] as TNum },

  } as any;

	constructor (bolt: Bolt) {
		this.bolt     = bolt;
	}

	async queue(name: string, overwrites: any = {}) {
    const message = Object.assign({ name }, this.sensors[name], overwrites);
    return await this.bolt.queue.queueMessage(message);
  }

	async activate() {

    Logger.info(this.bolt, 'Sensors.activate');

    await this.eventGyro(1);
    await this.eventCharger(1);
    await this.eventBattery(1);
    await this.eventInfrared(1);
    await this.eventCollision(1);

    return Promise.resolve(true);

  }

  async info() {

    Logger.info(this.bolt, 'Sensors.info');

    await this.batteryState();
    await this.chargerState();
    await this.ambientLight();
    await this.batteryVoltage();

    return Promise.resolve(true);

  }


  // - - - - - EVENTS - - - - //

  async eventBattery( onoff: TOnOff ) {
    return await this
      .queue('eventBattery', { data: [ onoff ]})
    ;
  }
  async eventCharger( onoff: TOnOff ) {
    return await this
      .queue('eventCharger', { data: [ onoff ]})
    ;
  }
  async eventGyro( onoff: TOnOff ) {
    return await this
      .queue('eventGyro', { data: [ onoff ]})
    ;
  }
  async eventCollision( onoff: TOnOff ) {
    const xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01
    return onoff === 0
      ? await this.queue('eventCollision', { data: [ 0 ]})
      : await this.queue('eventCollision', { data: [ method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime ]})
    ;
  }
  async eventInfrared( onoff: TOnOff) {
    return onoff === 0
      ? await this.queue('eventInfrared', { data: [ 0, 0, 0, 0, 0 ]})
      : await this.queue('eventInfrared', { data: [ 1, 2, 3, 4, 5 ]})
    ;
  }


  // - - - - -  INFOS  - - - - //

  async batteryVoltage() {
    return await this
      .queue('batteryVoltage')
      .then(action => {
        let voltage = action.response[0] << 8;
        voltage    += action.response[1];
        this.bolt.status.voltage = voltage / 100;
      })
    ;
  }
  async batteryState() {
    return await this
      .queue('batteryState')
      .then(action => { this.bolt.status.battery = action.response[0]; })
    ;
  }
  async chargerState() {
    return await this
      .queue('chargerState')
      .then(action => { this.bolt.status.charger = action.response[0]; })
    ;
  }

  // The light intensity from 0 - 100,000 lux, where 0 lux is full darkness and 30,000-100,000 lux is direct sunlight
  async ambientLight() {
    return await this
      .queue('ambientLight')
      .then(action => { this.bolt.status.ambient = action.response.join(' '); })
    ;
  }


// - - - - -  SENSORDATA  - - - - //

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

  /* Sends sensors mask to Sphero (acceleremoter, orientation and locator) */
  // https://github.com/Tineyo/BoltAPP/blob/2662d790cbd66eea008af0484aa5a1bd5b720172/scripts/sphero/spheroBolt.js#L170
  async sensorMask(rawValue: number, interval: number) {
    return await this.bolt.queue.queueMessage({
      name: 'sensorMask',
      device: C.Device.sensor,
      command: C.CMD.Sensor.sensorMask, // SensorCommandIds.sensorMask,
      target: 0x12,
      data: [
        (interval >>  8) & 0xFF,
        (interval)       & 0xFF,
          0,
        (rawValue >> 24) & 0xFF,
        (rawValue >> 16) & 0xFF,
        (rawValue >>  8) & 0xFF,
        (rawValue)       & 0xFF,
      ],
    });
  }

  /* Only for Gyro Sesnsor Data */
  async sensorMaskExtended(rawValue: any) {
    return await this.bolt.queue.queueMessage({
      name: 'sensorMaskExtended',
      device: C.Device.sensor,
      command: C.CMD.Sensor.sensorMaskExtented, // SensorCommandIds.sensorMaskExtented,
      target: 0x12,
      data: [
        (rawValue >> 24) & 0xFF,
        (rawValue >> 16) & 0xFF,
        (rawValue >>  8) & 0xFF,
        (rawValue >>  0) & 0xFF,
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


// EDU: current firmware versions 4.2.41, 4.2.44

// night, ceiling light: [0, 65, 64, 82, 18], [0, 65, 66, 43, 241], [0, 65, 64, 82, 18]
// battery max 164, min: 1.01

// 	* An 8-bit value is returned for each infrared sensor, assigned by mask.
// 	Mask description on BOLT: 32'h0000_00ff: front left sensor 32'h0000_ff00: front right sensor 32'h00ff_0000: back right sensor 32'hff00_0000: back left sensor
// 	* @returns Promise that resolves with the response from RVR for given command
// 	*/
//  getBotToBotInfraredReadings(): Promise<string | never>;
//  /**

// async enableCollisionEvent(xThreshold = 100, yThreshold = 100, xSpeed = 100, ySpeed = 100, deadTime = 10, method = 0x01) {
//   return await this
//     .queue('eventCollision', { data: [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]})
//   ;
// }
// async disableCollisionEvent() {
//   return await this
//     .queue('eventCollision', { data: [0]})
//   ;
// }

  // async enableBatteryEvent() {
  //   return await this.bolt.queue.queueMessage({
  //     name:      'enableBatteryEvent',
  //     device:    C.Device.powerInfo,
  //     command:   C.CMD.Power.powerInfo,
  //     target:    0x11,
  //     data: [1]
  //   });
  // }
  // async enableChargerEvent() {
  //   return await this.bolt.queue.queueMessage({
  //     name:      'enableChargerEvent',
  //     device:    C.Device.powerInfo,
  //     command:   0x20, //C.CMD.Power.chargerEvent,
  //     target:    0x11,
  //     data: [1]
  //   });
  // }
  // async enableGyroEvent() {
  //   return await this.bolt.queue.queueMessage({
  //     name:      'enableGyroEvent',
  //     device:    C.Device.sensor,
  //     command:   0x0F, // C.CMD.Sensor.gyroEvent,
  //     target:    0x12,
  //     data: [1]
  //   });
  // }
  // async disbaleGyroEvent() {
  //   return await this.bolt.queue.queueMessage({
  //     name:      'enableGyroEvent',
  //     device:    C.Device.sensor,
  //     command:   0x0F, // C.CMD.Sensor.gyroEvent,
  //     target:    0x12,
  //     data: [0]
  //   });
  // }
  // async enableInfraredEvent(channel: number) {
  //   return await this.bolt.queue.queueMessage({
  //     name:      'enableInfraredEvent',
  //     device:    C.Device.sensor,
  //     command:   0x2B, //C.CMD.Sensor.infraredListenEvent,
  //     target:    0x12,
  //     data:     [1, 2, 3, 4, 5]
  //   });
  // }

  //   return await this.bolt.queue.queueMessage({
  //     name:    'enableCollisionEvent',
  //     device:  C.Device.sensor,
  //     command: C.CMD.Sensor.collisionEvent, // SensorCommandIds.configureCollision,
  //     target:  0x12,
  //     data:   [method, xThreshold, xSpeed, yThreshold, ySpeed, deadTime]
  //   });
  // }
  // async disableCollisionEvent() {
  //   return await this.bolt.queue.queueMessage({
  //     name:    'enableCollisionEvent',
  //     device:  C.Device.sensor,
  //     command: 0x14, //C.CMD.Sensor.collisionEvent, // SensorCommandIds.configureCollision,
  //     target:  0x12,
  //     data:   [0]
  //   });
  // }

};
