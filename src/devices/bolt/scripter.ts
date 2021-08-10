import m from "mithril";

import { CONSTANTS as C }  from '../constants';
import { IStatus, TColor, IEvent } from "./interfaces";
import { wait } from './utils'

import { Aruco } from '../../services/aruco';
import { Receiver } from './receiver';
import { Bolt } from './bolt';
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

  private name:       string;
  private config:     any;
  private parent:     any;

  private corpus = H.deepFreezeCreate({
    verbs: {
      async step1 (...args: any) { console.log('now step1', args); return await wait.apply(this.host, args); },
      async step2 (...args: any) { console.log('now step2', args); return await wait.apply(this.host, args); },

    },
    nouns: {},
    props: {
      heading: async () => {},
    },
  }) as any;

  constructor (parent: any) {
    this.parent = parent;
  }

  execute () {

    const self = this;
    const stack = [] as any;

    const proxy = new Proxy({}, {
      get (target: any, name: string ) {

        const instruction = self.findInCorpus(name);

        if ( name === 'end') {
          // debugger;
          (async () => {
            for ( const instruction of stack ){
              await instruction();
            }
          })();

        } else if ( instruction ) {
          console.log('found: ', target, name);
          return (...args: any) => {
            stack.push(instruction.bind(this, ...args))
            return proxy;
          };

        } else {
          throw "Scripter: Instruction '" + name + "' is not a valid script instruction";

        }

      },
    }) as any;

    return proxy;

  }

  findInCorpus (word: string) {

    for (const wordclass of Object.keys(this.corpus)) {
      const candidate = this.corpus[wordclass][word];
      if ( candidate ) {
        return candidate
      }
    }
    return null;

  }

  // proxyHandler () {

  //   const self = this;

  //   return {
  //     async get (target: any, name: string ) {

  //       const candidate = self.findInCorpus(name);

  //       if ( candidate ) {
  //         console.log('found: ', target, name);
  //         return await candidate;

  //       }
  //     },
  //   }

  // }


  wrap () {}

}
