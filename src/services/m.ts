
export const M = {

  // signed difference between two angles in degrees, range [0, 180]
  angleDistance(a: number, b: number) {
    const phi = Math.abs(b - a) % 360;       // This is either the distance or 360 - distance
    const distance = phi > 180 ? 360 - phi : phi;
    const sign = (( a - b >= 0 ) && ( a - b <= 180 )) || (( a - b <= -180 ) && ( a - b >= -360 )) ? 1 : -1;
    return distance * sign;
  }

}
