import m from "mithril";
import Factory   from './factory';

import { Bolts } from '../devices/bolt/bolts';
import { Bolt } from "../devices/bolt/bolt";

import { ISensorData } from '../devices/bolt/interfaces';

let cvs: any;
let ctx: CanvasRenderingContext2D;

const size = 512;

const meta = { cx:0, cy: 0, max: 0, maxx: 0, maxy: 0, miny: +Infinity, minx: +Infinity, scale: 1, transsform: [0, 0] } ;

const testData = ( function () {

  const amount = 100, max = 200, off = 80;

  let i, x, y, result = [];

  for (i=0; i<amount; i++){
    x = Math.random() * 2 * max - max + off;
    y = Math.random() * 2 * max - max + off;
    result.push({index: i, locator: {positionX: x, positionY: y}});
  }
  return result;

})();

const plot = {

  strokeRect (ctx:CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    const s2 = size/2;
    ctx.strokeRect(cx - s2, cy -s2, size, size)
  },

  strokeLine (ctx: any, x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

}


const Plotter = Factory.create('Plotter', {

    oncreate ( vnode: any ) {
      cvs = cvs || vnode.dom ;
      ctx = cvs.getContext('2d');
    },

    onupdate ( vnode: any ) {
      cvs = cvs || vnode.dom ;
      ctx = cvs.getContext('2d');
    },

    plotCoords (ctx: CanvasRenderingContext2D, meta: any) {

      const imax     = parseInt(String(meta.max), 10);
      const imaxx     = parseInt(String(meta.max), 10);
      const scale    = meta.scale;
      const fontSize = parseInt(String(12 / scale), 10);

      ctx.font = `normal ${fontSize}px monospace`;
      ctx.lineWidth = 0.5 / scale;

      // show origin
      ctx.fillStyle = '#888';
      ctx.textAlign = 'left';
      ctx.fillText('0,0', 8 / scale, -8 / scale );

      // show min max
      ctx.strokeStyle = '#800'
      ctx.fillStyle = '#888';
      ctx.strokeRect(meta.minx, meta.miny, meta.maxx - meta.minx, meta.maxy - meta.miny);
      ctx.textAlign = 'right';
      ctx.fillText( `${imax},${imax}`, imax -4/scale, imax -4/scale );

      ctx.strokeStyle = '#ddd'
      plot.strokeRect(ctx, 0, 0, 512);
      plot.strokeRect(ctx, 0, 0, 256);
      plot.strokeRect(ctx, 0, 0, 100);
      plot.strokeRect(ctx, 0, 0, 10);
      plot.strokeRect(ctx, 0, 0, 5);
      plot.strokeRect(ctx, 0, 0, 1);
      plot.strokeRect(ctx, 0, 0, 0.5);
      plot.strokeRect(ctx, 0, 0, 0.1);

      ctx.strokeStyle = '#888'
      plot.strokeLine(ctx, 0, 0, meta.maxx, 0);
      plot.strokeLine(ctx, 0, 0, 0, meta.maxy);
      plot.strokeLine(ctx, 0, 0, -meta.maxx, 0);
      plot.strokeLine(ctx, 0, 0, 0, -meta.maxy);



    },


    plotSeries (ctx: CanvasRenderingContext2D, meta: any, series: any) {

      // console.log('Plotter.scale.max', meta.scale, meta.max);

      series.forEach( (serie:any) => {

        ctx.fillStyle   = '#F0F';
        ctx.strokeStyle = serie.color;
        serie.data.forEach( (entry: ISensorData) => {
          const x = entry.locator.positionX;
          const y = entry.locator.positionY;
          plot.strokeRect(ctx, x, y, 2 / meta.scale);
        });

        // console.log('plotted', serie.color, serie.data.length)

      });

    },

    analyze (data: any) {
      meta.maxx  = Math.max.apply(Math, data.map( (e: any) => e.locator.positionX ));
      meta.maxy  = Math.max.apply(Math, data.map( (e: any) => e.locator.positionY ));
      meta.minx  = Math.min.apply(Math, data.map( (e: any) => e.locator.positionX ));
      meta.miny  = Math.min.apply(Math, data.map( (e: any) => e.locator.positionY ));
      meta.max   = Math.max(Math.abs(meta.maxx), Math.abs(meta.maxy), Math.abs(meta.minx), Math.abs(meta.miny));
      meta.cx    = ( meta.maxx + meta.minx ) / 2;
      meta.cy    = ( meta.maxy + meta.miny ) / 2;
    },

    render ( ) {

      const series = [] as any;
      meta.max = 0;

      if (cvs && ctx ) {

        cvs.width = cvs.width;

        Bolts.forEach ( (bolt: Bolt) => {
          const data = bolt.receiver.logs.sensor.slice(-50);
          Plotter.analyze(data);
          series.push({ color: bolt.config.colors.plot, data });
        });

        // if (meta.max === 0) {
        //   Plotter.analyze(testData);
        //   series.push({ color: 'darkred', data: testData });
        // }


        ctx.save();

        meta.scale = size / meta.max / 1.05 / 2;

        // ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(size/2 - meta.cx, size/2 - meta.cy);
        ctx.scale(meta.scale, meta.scale);  // toggle origin too

        Plotter.plotCoords (ctx, meta);
        Plotter.plotSeries(ctx, meta, series);

        ctx.restore();

      }

    },

    view () {
      this.render();
      return m('canvas.bg-white', {width: size, height: size, onclick: this.render });
    },

});

export { Plotter };
