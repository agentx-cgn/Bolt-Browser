import m from "mithril";
import Factory   from './factory';

import { Bolts } from '../devices/bolt/bolts';
import { Bolt } from "../devices/bolt/bolt";

import { ISensorData } from '../devices/bolt/interfaces';

let cvs: any;
let ctx: any;

const size = 256;

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

      if (cvs && ctx ) {

        cvs.width = cvs.width;

        Bolts.forEach ( (bolt: Bolt) => {

          ctx.save();
          ctx.translate(size/2, size/2);
          ctx.fillStyle = '#FF0000';

          const latest = bolt.sensors.log.slice(-50);

          const maxx  = Math.max.apply(Math, latest.map( e => Math.abs(e.locator.positionX)));
          const maxy  = Math.max.apply(Math, latest.map( e => Math.abs(e.locator.positionY)));
          const max   = Math.max(maxx, maxy) * 1.1;
          const scale = max / size;

          latest.forEach( (entry: ISensorData) => {

            const x = entry.locator.positionX;
            const y = entry.locator.positionY;

            // ctx.fillRect((x-1) * scale, (y-1) * scale, (x+1) * scale, (x+1) * scale);
            ctx.fillRect(x-1, y-1, x+1, x+1);

          });

          ctx.scale(scale, scale);

          ctx.restore();

        });

      }

    },

    view () {
      return m('canvas.bg-white', {width: 256, height: 256});
    },

});

export { Canvas };