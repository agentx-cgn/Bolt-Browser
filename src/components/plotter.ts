import m from "mithril";
import Factory   from './factory';

import { Bolts } from '../devices/bolt/bolts';
import { Bolt } from "../devices/bolt/bolt";

import { ISensorData } from '../devices/bolt/interfaces';


let series = [] as any;
let cvs: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const size = 512;

const meta = {
  length:   0,
  cx:       0,         cy:      0,
  max:      0,         min:    +Infinity,
  maxx:     0,         maxy:    0,
  miny:    +Infinity,  minx:   +Infinity,
  scale:    1,         transX:  0,          transY: 0
} ;


let includes = [];
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

    meta () { return meta },

    oncreate ( vnode: any ) {
      cvs = cvs || vnode.dom ;
      ctx = cvs.getContext('2d');
    },

    onupdate ( vnode: any ) {
      cvs = cvs || vnode.dom ;
      ctx = cvs.getContext('2d');
    },

    view () {
      this.render();
      return m('canvas.bg-white', {width: size, height: size, onclick: this.onClick.bind(this) });
    },

  onClick (event: MouseEvent) {

    const rect = cvs.getBoundingClientRect();

    let x = (event.x - rect.left -  meta.transX ) / meta.scale ;
    let y = (event.y - rect.top  -  meta.transY ) / meta.scale ;

    this.render({positionX: x, positionY: y, color: 'red'});

    console.log('Plotter.click', x, y);

  },


  reset () {
    series = [
      { positionX: -50, positionY: -50, color: 'darkred' },
      { positionX: +50, positionY: -50, color: 'darkred' },
      { positionX: +50, positionY: +50, color: 'darkred' },
      { positionX: -50, positionY: +50, color: 'darkred' },
    ];
    this.render();
  },

  calculateStepSize(range: number, targetSteps: number){

    // calculate an initial guess at step size
      const tempStep = range/targetSteps;

      // get the magnitude of the step size
      const mag = Math.floor(Math.log10(tempStep));
      const magPow = Math.pow(10, mag);

      // calculate most significant digit of the new step size
      let magMsd = ~~(tempStep/magPow + 0.5);

      // promote the MSD to either 1, 2, or 5
      if (magMsd > 5.0)
          magMsd = 10.0;
      else if (magMsd > 2.0)
          magMsd = 5.0;
      else if (magMsd > 1.0)
          magMsd = 2.0;

      return magMsd * magPow;
  },

  plotDecoration (ctx: CanvasRenderingContext2D, meta: any) {

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
    const off = 1.05;
    // const iminxoff = Math.floor(off * meta.minx);
    // const iminyoff = ~~(off * meta.miny);
    // const imaxxoff = ~~(off * meta.maxx);
    // const imaxyoff = ~~(off * meta.maxy);
    ctx.strokeStyle = '#800'
    ctx.fillStyle = '#888';
    ctx.strokeRect(meta.minx * off, meta.miny * off, (meta.maxx - meta.minx) * off, (meta.maxy - meta.miny) * off);
    ctx.textAlign = 'right';
    ctx.fillText( `${imax},${imax}`, imax -4/scale, imax -4/scale );

    ctx.strokeStyle = '#ddd'
    plot.strokeRect(ctx, 0, 0, 512);
    plot.strokeRect(ctx, 0, 0, 256);
    plot.strokeRect(ctx, 0, 0, 100);
    plot.strokeRect(ctx, 0, 0, 50);
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


  plotData (ctx: CanvasRenderingContext2D, meta: any, data: any) {

    data.forEach( (point:any) => {

      ctx.strokeStyle = point.color;
      const x = point.positionX;
      const y = point.positionY;
      plot.strokeRect(ctx, x, y, 2 / meta.scale);

    });

  },

  analyzeData (data: any) {

    meta.length = data.length;
    meta.maxx  = Math.max.apply(Math, data.map( (loc: any) => loc.positionX ));
    meta.maxy  = Math.max.apply(Math, data.map( (loc: any) => loc.positionY ));
    meta.minx  = Math.min.apply(Math, data.map( (loc: any) => loc.positionX ));
    meta.miny  = Math.min.apply(Math, data.map( (loc: any) => loc.positionY ));
    meta.max   = Math.max(meta.maxx, meta.maxy);
    meta.min   = Math.min(meta.minx, meta.miny);
    meta.cx    = ( meta.maxx + meta.minx ) / 2;
    meta.cy    = ( meta.maxy + meta.miny ) / 2;

    meta.scale = size / meta.max / 1.05 / 2;
    meta.transX = size/2 - meta.cx;
    meta.transY = size/2 - meta.cy;

  },

  render ( location: any, color: string ) {

    if (location) {
      location.color = location.color || color || 'pink';
      series.push(location);
    }

    const data = series.slice(-100);
    Plotter.analyzeData(data);

    if (cvs && ctx && data.length) {

      const t0 = Date.now();

      cvs.width = cvs.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(meta.transX, meta.transY);
      ctx.scale(meta.scale, meta.scale);

      Plotter.plotDecoration (ctx, meta);
      Plotter.plotData(ctx, meta, data);

      console.log('Plotter.render', series.length, 'points', 'msecs', Date.now() - t0 );

    }

  },

});

export { Plotter };
