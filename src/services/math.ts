import { IPoint } from "../devices/bolt/interfaces";

export const math = {

  // signed difference between two angles in degrees, range [0, 180]
  angleDistance(a: number, b: number) {
    const phi = Math.abs(b - a) % 360;       // This is either the distance or 360 - distance
    const distance = phi > 180 ? 360 - phi : phi;
    const sign = (( a - b >= 0 ) && ( a - b <= 180 )) || (( a - b <= -180 ) && ( a - b >= -360 )) ? 1 : -1;
    return distance * sign;
  },

  distance(a: IPoint, b: IPoint) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  },

  // angle to drive from a to b, 0 is north
  heading (a: IPoint, b: IPoint) {
    // Math.atan2(y - target.y, x - target.x) * -180 / Math.PI +270;
    return Math.atan2(a.y - b.y, a.x - b.x) * -180 / Math.PI +270;
  },

  mod (a: number) {
    return a % 360;
  },

}



/*
function angle (L, x0, y0, x1, y1) {console.log(L, x0, y0, '|', x1, y1, '=>', ~~(Math.atan2(y0 - y1, x0 - x1) * 180 / Math.PI) -270) }
angle('N', 0, 0,   0,  10)
angle('E', 0, 0,  10,   0)
angle('S', 0, 0,   0, -10)
angle('N', 0, 0, -10,   0)

N 0 0 | 0 10 => -360
VM1231:1 E 0 0 | 10 0 => -90
VM1231:1 S 0 0 | 0 -10 => -180
VM1231:1 N 0 0 | -10 0 => -270

function angle (L, soll, x0, y0, x1, y1) {console.log(L, soll, '=>', +(~~(Math.atan2(y0 - y1, x0 - x1) * -180 / Math.PI) +270) ) }
angle('N',   0, 0,   0,   0,  10)
angle('E',  90, 0,   0,  10,   0)
angle('S', 180, 0,   0,   0, -10)
angle('W', 270, 0,   0, -10,   0)
N 0 => 360
E 90 => 90
S 180 => 180
W 270 => 270

*/
