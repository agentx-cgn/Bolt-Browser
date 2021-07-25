


export const Aruco = {

  createImage(code: number=0): number[][] {


    // https://damianofalcioni.github.io/js-aruco2/samples/marker-creator/marker-creator.html?dictionary=ARUCO

    switch (code) {

      // keep empty top row, 2 bottom row, left column. 2 right cols

      case 73 :
        return [
          [0,   0,0,0,0,0,  0,0], 

          [0,   1,0,0,0,0,  0,0],
          [0,   1,0,1,1,1,  0,0],
          [0,   1,0,0,0,0,  0,0],
          [0,   0,1,0,0,1,  0,0],
          [0,   1,0,1,1,1,  0,0],

          [0,   0,0,0,0,0,  0,0],
          [0,   0,0,0,0,0,  0,0],
        ];
      break;
      default: 

        return [
          [0,0,0,1,1,0,0,0],
          [0,0,0,1,1,0,0,0],
          [0,0,1,0,0,1,0,0],
          [0,1,0,0,0,0,1,0],
          [1,0,0,0,0,0,0,1],
          [0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0],
        ];

    }

  }

}
