// Services
const UUID_SPHERO_SERVICE            = '00010001-574f-4f20-5370-6865726f2121';
const APIV2_CHARACTERISTIC           = '00010002-574f-4f20-5370-6865726f2121';

// Characteristics
const UUID_SPHERO_SERVICE_INITIALIZE = '00020001-574f-4f20-5370-6865726f2121';
const DFU_CONTROL_CHARACTERISTIC     = '00020002-574f-4f20-5370-6865726f2121';
const SUBS_CHARACTERISTIC            = '00020003-574f-4f20-5370-6865726f2121';
const DFU_INFO_CHARACTERISTIC        = '00020004-574f-4f20-5370-6865726f2121';
const ANTIDOS_CHARACTERISTIC         = '00020005-574f-4f20-5370-6865726f2121';

const useTheForce = new Uint8Array([0x75, 0x73, 0x65, 0x74, 0x68, 0x65, 0x66, 0x6f, 0x72, 0x63, 0x65, 0x2e, 0x2e, 0x2e, 0x62, 0x61, 0x6e, 0x64]);

// processors = unknown: 0, primary: 17, secondary: 18,

const Device = {
  apiProcessor:                16,
  systeminfo:                  17, // 0x11
  powerInfo:                   19, // 0x13
  driving:                     22,
  sensor:                      24, // 0x18
  bluetooth:                   25, // 0x19
  userIO:                      26,
}

const Events = {                 // from
  sensor:                  0x02, // 0x18
  gyro:                    0x10, // 0x18
  collision:               0x12, // 0x18
  willsleep:               0x19, // 0x13
  didsleep:                0x1A, // 0x13
  battery:                 0x1C, // 0x13 // voltage
  charger:                 0x21, // 0x13 // state
  yaw:                     0x26, // 0x18
  infrared:                0x2C, // 0x18
};

const CMD = {

  Api: {
    ping:                    0x00,
  },



  SystemInfo : {
    mainApplicationVersion:  0x00,
    bootloaderVersion:       0x01,
    boardRevision:           0x03,
    macAddress:              0x06,
    statsID:                 0x13,
    bootReason:              0x20,
    lastError:               0x21,
    sku:                     0x38,
  },

  Driving : {
    rawMotor:                   1,
    driveAsRc:                  2,
    driveAsSphero:              4,
    resetYaw:                   6,
    driveWithHeading:           7,
    tankDrive:                  8,
    stabilization:             12,
  },

  Power : {                //0x13
    deepSleep:               0x00,
    sleep:                   0x01,
    batteryVoltage:          0x03,
    wake:                    0x0D,
    batteryVoltageState:     0x17,
    eventBattery:            0x1B,
    chargerState:            0x1F, // 31
    eventCharger:            0x20,

    // willSleepAsync:            25,
    // sleepAsync:                26,
    // batteryStateChange:        33,
    // get_battery_percentage : 0x10, // ?? Bad command id
  },

  IO : {                  // 0x1A
    allLEDs:                   28,
    matrixClear:               56,
    matrixPixel:               45,
    matrixColor:               47,
    matrixRotation:            58,
    matrixScrollText:          59,
    matrixScrollNotification:  60,
    matrixLine:                61,
    matrixFill:                62,
    matrixChar:                66,
  },

  Sensor : {              // 0x18
    sensorMask:                 0,
    sensorResponse:             2,
    sensorMaskExtented:        12,
    eventGyro:                 0x0F, //15,
    eventCollision:            0x11, //17,
    collisionDetectedAsync:    18,
    resetLocator:              19,
    flagsLocator:              0x17,
    calibrateToNorth:          0x25, //37,
    infraredReadings:          0x22,
    infraredStartBroadcast:    0x27,
    infraredStopBroadcast:     0x29,
    infraredSendMessage:       0x2A,
    eventInfrared:             0x2B,
    ambientLight:              0x30, //48
  }

}

const API = {
  escapedStartOfPacket :   5,
  escapedEscape:          35,
  escapedEndOfPacket :    80,
  escapeMask:            136,
  startOfPacket:         141,
  escape:                171,
  endOfPacket:           216,
}

// export type TBatteryState = 0|1|2|3;
const Battery = {
  unknown:     0,
  notCharging: 1,
  charging:    2,
  charged:     3,
}

// const ApiErrors = {
const Errors = {
  success:              0,
  badDeviceId:          1,
  badCommandId:         2,
  notYetImplemented:    3,
  commandIsRestricted:  4,
  badDataLength:        5,
  commandFailed:        6,
  badParameterValue:    7,
  busy:                 8,
  badTargetId:          9,
  targetUnavailable:   10,
  unknown:            255,
}

const Flags = {
  isResponse:                   1,
  requestsResponse:             2,
  requestsOnlyErrorResponse:    4,
  resetsInactivityTimeout:      8,
  commandHasTargetId:          16,
  commandHasSourceId:          32,
}

const FrameRotation = {
  deg0:   0x00,
  deg90:  0x01,
  deg180: 0x02,
  deg270: 0x03,
}

const StabilizationIndex = {
  no_control_system:            0x00,
  full_control_system:          0x01,
  pitch_control_system:         0x02,
  roll_control_system:          0x03,
  yaw_control_system:           0x04,
  speed_and_yaw_control_system: 0x05,
}

const SensorMaskValues = {
  off: 0,
  locator: 1,
  gyro: 2,
  orientation: 3,
  accelerometer: 4
}

const SensorMask = {

  off:                          0,
  velocityY:              1 <<  3,
  velocityX:              1 <<  4,
  locatorY:               1 <<  5,
  locatorX:               1 <<  6,

  gyroZFiltered:          1 << 23,
  gyroYFiltered:          1 << 24,
  gyroXFiltered:          1 << 25,

  accelerometerZFiltered: 1 << 13,
  accelerometerYFiltered: 1 << 14,
  accelerometerXFiltered: 1 << 15,
  imuYawAngleFiltered:    1 << 16,
  imuRollAngleFiltered:   1 << 17,
  imuPitchAngleFiltered:  1 << 18,

  gyroFilteredAll:        58720256,
  orientationFilteredAll:   458752,
  accelerometerFilteredAll:  57344,
  locatorFilteredAll:          120,

}


export const CONSTANTS = {

  CMD,
  Events,
  SensorMask,
  SensorMaskValues,
  Device,
  Flags,
  Errors,
  Battery,
  API,
  useTheForce,

  StabilizationIndex,
  FrameRotation,

  UUID_SPHERO_SERVICE,
  UUID_SPHERO_SERVICE_INITIALIZE,
  APIV2_CHARACTERISTIC,
  ANTIDOS_CHARACTERISTIC,
  DFU_CONTROL_CHARACTERISTIC,
  DFU_INFO_CHARACTERISTIC,
  SUBS_CHARACTERISTIC,

}
