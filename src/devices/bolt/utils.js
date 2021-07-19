import { CONSTANTS as C } from '../../globals/constants';

export function commandPushByte(command, b){
    switch (b){
    	case C.APIConstants.startOfPacket:
    		command.push(C.APIConstants.escape, C.APIConstants.escapedStartOfPacket);
			break;
    	case C.APIConstants.escape:
    		command.push(C.APIConstants.escape, C.APIConstants.escapedEscape);
			break;
    	case C.APIConstants.endOfPacket:
    		command.push(C.APIConstants.escape, C.APIConstants.escapedEndOfPacket);
			break;
    	default:
    		command.push(b);
    }	    
}

export function decodeFlags(flags){
	let isResponse = flags & C.Flags.isResponse;
	let requestsResponse = flags & C.Flags.requestsResponse;
	let requestOnlyErrorResponse = flags & C.Flags.requestOnlyErrorResponse;
	let resetsInactivityTimeout = flags & C.Flags.resetsInactivityTimeout;
	let hasTargetId = flags & C.Flags.commandHasTargetId;
	let hasSourceId = flags & C.Flags.commandHasSourceId;
	return{
		isResponse,
		requestsResponse,
		requestOnlyErrorResponse,
		resetsInactivityTimeout,
		hasTargetId,
		hasSourceId,
	}
}

const wait = (time) =>  {return new Promise(callback => setTimeout(callback, time))};

// const maskToRaw = (sensorMask) => {
export function maskToRaw (sensorMask) {
	return {
		aol: sensorMask.reduce((aol, m) => {
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
		gyro: sensorMask.reduce((gyro,m) => {
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
export function flatSensorMask (sensorMask) {
  sensorMask.reduce((bits, m) => { return (bits |= m); }, 0);
} 

// const parseSensorResponse = (data, mask) => {
export function parseSensorResponse (data, mask) {
	let state = {data,
				 mask,
				 offset: 0,
				 response: {},
				}
	state = fillAngle(state);
	state = fillAccelerometer(state);
	state = fillLocator(state);
	state = fillGyro(state);
	return state.response;
}

export function convertBinaryToFloat (data, offset) {
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

export function  fillAngle (state) {
	const {data, mask} = state;
	let {offset, response} = state;

	if (mask.aol.indexOf(C.SensorMask.orientationFilteredAll) >= 0){
		let pitch = convertBinaryToFloat(data, offset);
		offset += 4;

		let roll = convertBinaryToFloat(data, offset);
		offset += 4;

		let yaw = convertBinaryToFloat(data, offset);
		offset += 4;

		response.angles = {
			pitch,
			roll,
			yaw,
		};
	}
	return{
		data,
		mask,
		offset,
		response,
	};
}

export function fillAccelerometer (state) {
	const {data, mask} = state;
	let {offset, response} = state;

	if (mask.aol.indexOf(C.SensorMask.accelerometerFilteredAll) >= 0){
		let x = convertBinaryToFloat(data, offset);
		offset += 4;

		let y = convertBinaryToFloat(data, offset);
		offset += 4;

		let z = convertBinaryToFloat(data, offset);
		offset += 4;

		response.accelerometer = {
			x,
			y,
			z,
		};
	}
	return{
		data,
		mask,
		offset,
		response,
	};
}

export function fillLocator (state) {
	const {data, mask} = state;
	let {offset, response} = state;

	if (mask.aol.indexOf(C.SensorMask.locatorFilteredAll) >= 0){
		let positionX = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;
		
		let positionY = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;

		let velocityX = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;

		let velocityY = convertBinaryToFloat(data, offset) * 100.0;
		offset += 4;

		response.locator = {
			positionX,
			positionY,
			velocityX,
			velocityY,
		};
	}
	return{
		data,
		mask,
		offset,
		response,
	};
}

export function  fillGyro (state) {
	const {data, mask} = state;
	let {offset, response} = state;

	if (mask.gyro.indexOf(C.SensorMask.gyroFilteredAll) >= 0){
		let x = convertBinaryToFloat(data, offset);
		offset += 4;

		let y = convertBinaryToFloat(data, offset);
		offset += 4;

		let z = convertBinaryToFloat(data, offset);
		offset += 4;

		response.gyro = {
			x,
			y,
			z,
		}
	}
	return{
		data,
		mask,
		offset,
		response,
	};
}