import m from "mithril";
import Factory   from './factory';

import { Bolts } from '../devices/bolt/bolts';
import { Bolt } from "../devices/bolt/bolt";

import { ISensorData } from '../devices/bolt/interfaces';

let cvs: any;
let ctx: CanvasRenderingContext2D;

let max = 0, maxx: number, maxy: number, minx: number, miny: number, scale = 1;

const size = 512;

const testData = function () {

  let i, x, y, result = [];

  for (i=0; i<100; i++){
    x = Math.random() * 2 -1;
    y = Math.random() * 2 -1;
    result.push({locator: {positionX: x, positionY: y}});
  }
  return result;

}();

const Canvas = Factory.create('Canvas', {

    oncreate ( vnode: any ) {
      cvs = cvs || vnode.dom ;
      ctx = cvs.getContext('2d');
    },

    onupdate ( vnode: any ) {
      cvs = cvs || vnode.dom ;
      ctx = cvs.getContext('2d');
    },

    render ( ) { 

      function strokeRect(ctx:CanvasRenderingContext2D, x: number, y: number, size: number) {
        const s2 = size/2;
        ctx.strokeRect(x - s2, y -s2, size, size)
      }

      if (cvs && ctx ) {

        cvs.width = cvs.width;

        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.fillStyle = '#FF0000';

        Bolts.forEach ( (bolt: Bolt) => {

          const latest = bolt.receiver.logs.sensor.slice(-50);
          // const latest = testData;

          if (latest.length) {

            maxx  = Math.max.apply(Math, latest.map( (e: any) => e.locator.positionX ));
            maxy  = Math.max.apply(Math, latest.map( (e: any) => e.locator.positionY ));
            minx  = Math.min.apply(Math, latest.map( (e: any) => e.locator.positionX ));
            miny  = Math.min.apply(Math, latest.map( (e: any) => e.locator.positionY ));

            max   = Math.max(maxx, maxy) * 1.1;
            scale = size / max / 2;

            console.log('Canvas.scale.max', scale, max);
            ctx.scale(scale, scale);  // 

            ctx.lineWidth = 2 / scale;

            ctx.strokeStyle = '#ddd'
            strokeRect(ctx, 0, 0, 100)
            strokeRect(ctx, 0, 0, 10)
            strokeRect(ctx, 0, 0, 5)
            strokeRect(ctx, 0, 0, 1)
            strokeRect(ctx, 0, 0, 0.1)

            ctx.strokeStyle = '#333'
            latest.forEach( (entry: ISensorData) => {
              const x = entry.locator.positionX;
              const y = entry.locator.positionY;
              strokeRect(ctx, x, y, 2 / scale);
            });

          }

          
        });
        
        ctx.restore();

      }

    },

    view () {
      this.render();
      return m('canvas.bg-white', {width: size, height: size, onclick: this.render });
    },

});

export { Canvas };