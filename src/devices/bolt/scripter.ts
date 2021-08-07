import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { IStatus, TColor, IEvent } from "./interfaces";
import { wait } from './utils'

import { Aruco } from '../../services/aruco';
import { Receiver } from './receiver';
import { Actuators } from './actuators';
import { Sensors } from './sensors';
import { Queue } from './queue';
import { H } from "../../services/helper";

/**
 *
  this.bot.sript



 *
 */

export class Scripter {

  public name:       string;
  public config:     any;

  public characs = new Map();
  public device:     BluetoothDevice;

  private corpus = {
    verbs: {
      roll:      async () => { await wait( 200); console.log('did roll  200')},
      stop:      async () => { await wait( 400); console.log('did stop  400')},
      turn:      async () => { await wait( 600); console.log('did turn  600')},
      calibrate: async () => { await wait( 800); console.log('did roll  800')},
      reset:     async () => { await wait(1000); console.log('did roll 1000')},
    },
    nouns: {},
    props: {
      heading: async () => {},
    },
  } as any;

  constructor () {}

  sript () {

    const self = this;

    const proxy = new Proxy({}, {
      async get (target: any, name: string ) {

        const candidate = self.findInCorpus(name);

        if ( candidate ) {
          console.log('found: ', target, name);
          await candidate();
          return proxy;

        }
      },
    }) as any;

    return proxy;

  }

  findInCorpus (word: string) {

    for (const wordclass in Object.keys(this.corpus)) {
      const candidate = this.corpus[wordclass][word];
      if ( candidate ) {
        return candidate
      }
    }
    return null;

  }

  proxyHandler () {

    const self = this;

    return {
      async get (target: any, name: string ) {

        const candidate = self.findInCorpus(name);

        if ( candidate ) {
          console.log('found: ', target, name);
          await candidate();
          return 'tacos';

        }
      },
    }

  }


  wrap () {}

}
