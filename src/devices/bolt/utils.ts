import { CONSTANTS as C } from '../constants';

export function  ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

export function bufferToHex (buffer: ArrayBuffer) {
  return [...new Uint8Array (buffer)]
    .map (b => b.toString (16).padStart (2, "0"))
    .join ("")
  ;
}

export function commandPushByte(byteArray: number[], b: number ){
	switch (b){
		case C.APIConstants.startOfPacket:
			byteArray.push(C.APIConstants.escape, C.APIConstants.escapedStartOfPacket);
		break;
		case C.APIConstants.escape:
			byteArray.push(C.APIConstants.escape, C.APIConstants.escapedEscape);
		break;
		case C.APIConstants.endOfPacket:
			byteArray.push(C.APIConstants.escape, C.APIConstants.escapedEndOfPacket);
		break;
		default:
			byteArray.push(b);
	}	    
}

export function decodeFlags(flags: number){

	let isResponse = flags & C.Flags.isResponse;
	let requestsResponse = flags & C.Flags.requestsResponse;
	let requestsOnlyErrorResponse = flags & C.Flags.requestsOnlyErrorResponse;
	let resetsInactivityTimeout = flags & C.Flags.resetsInactivityTimeout;
	let hasTargetId = flags & C.Flags.commandHasTargetId;
	let hasSourceId = flags & C.Flags.commandHasSourceId;

	return {
		isResponse,
		requestsResponse,
		requestsOnlyErrorResponse, // was requestOnlyErrorResponse
		resetsInactivityTimeout,
		hasTargetId,
		hasSourceId,
	};

}

export function wait (time: number) {
  return new Promise(callback => setTimeout(callback, time))
};

// const maskToRaw = (sensorMask) => {
export function maskToRaw (sensorMask: number[]) {

	return {

		aol: sensorMask.reduce((aol: number[], m: number) => {

			let mask;

			switch(m){
				case C.SensorMaskValues.accelerometer:
					mask = C.SensorMask.accelerometerFilteredAll;
				break;
				case C.SensorMaskValues.locator:
					mask = C.SensorMask.locatorFilteredAll;
				break;
				case C.SensorMaskValues.orientation:
					mask = C.SensorMask.orientationFilteredAll;
				break;
			}

			if (mask){
				return [...aol, mask];
			}
			return aol;


		}, []),

		gyro: sensorMask.reduce((gyro: number[], m: number) => {
			let mask;
			if ( m === C.SensorMaskValues.gyro){
				mask = C.SensorMask.gyroFilteredAll;
			}
			if (mask){
				return [...gyro, mask];
			}
			return gyro;
		}, []),

	};

}

// const flatSensorMask = (sensorMask) => 
export function flatSensorMask (sensorMask: number[]) {
  return sensorMask.reduce((bits, m) => { return (bits |= m); }, 0);
} 

// const parseSensorResponse = (data, mask) => {
export function parseSensorResponse (data: any, mask: any) {

	let state = {
    data,
		mask,
		offset: 0,
		response: {},
	};

	state = fillAngle(state);
	state = fillAccelerometer(state);
	state = fillLocator(state);
	state = fillGyro(state);

	return state.response;

}

export function convertBinaryToFloat (data: number[], offset: number) {

	if ( offset + 4 > data.length ){
		console.log('error');
		return 0;
	}

	const uint8Tab = new Uint8Array ([
		data[offset],
		data[offset + 1],
		data[offset + 2],
		data[offset + 3],
  ]);

	const view = new DataView(uint8Tab.buffer);

	return view.getFloat32(0);

}

export function  fillAngle (state: any) {

	const { data, mask } = state;
	let { offset, response } = state;

	if (mask.aol.indexOf(C.SensorMask.orientationFilteredAll) >= 0){

		let pitch = convertBinaryToFloat(data, offset);
		offset += 4;

		let roll = convertBinaryToFloat(data, offset);
		offset += 4;

		let yaw = convertBinaryToFloat(data, offset);
		offset += 4;

		response.angles = { pitch, roll, yaw};

	}
	return { data, mask, offset, response	};
}

export function fillAccelerometer (state: any) {

	const { data, mask }     = state;
	let { offset, response } = state;

	if (mask.aol.indexOf(C.SensorMask.accelerometerFilteredAll) >= 0){

		let x = convertBinaryToFloat(data, offset);
		offset += 4;

		let y = convertBinaryToFloat(data, offset);
		offset += 4;

		let z = convertBinaryToFloat(data, offset);
		offset += 4;

		response.accelerometer = { x,	y, z };

	}

	return { data, mask, offset, response	};
}

export function fillLocator (state: any) {

	const { data, mask }     = state;
	let { offset, response } = state;

	if (mask.aol.indexOf(C.SensorMask.locatorFilteredAll) >= 0){
    
		let positionX = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;
		
		let positionY = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;

		let velocityX = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;

		let velocityY = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;

		response.locator = { positionX, positionY, velocityX,	velocityY	};

	}

	return { data, mask, offset, response	};

}

export function  fillGyro (state: any) {

	const { data, mask }     = state;
	let { offset, response } = state;

	if (mask.gyro.indexOf(C.SensorMask.gyroFilteredAll) >= 0){

		let x = convertBinaryToFloat(data, offset);
		offset += 4;

		let y = convertBinaryToFloat(data, offset);
		offset += 4;

		let z = convertBinaryToFloat(data, offset);
		offset += 4;

		response.gyro = {	x, y,	z };

	}

	return { data, mask, offset, response	};

}

export function logDataView (labelOfDataSource: string, key: string, valueDataView: DataView) {

	// https://googlechrome.github.io/samples/web-bluetooth/watch-advertisements.html

  const hexString = [...new Uint8Array(valueDataView.buffer)].map(b => {
    return b.toString(16).padStart(2, '0');
  }).join(' ');

  const textDecoder = new TextDecoder('ascii');
  const asciiString = textDecoder.decode(valueDataView.buffer);

  console.log(`  ${labelOfDataSource} Data: ` + key +
      '\n    (Hex) ' + hexString +
      '\n    (ASCII) ' + asciiString);
};