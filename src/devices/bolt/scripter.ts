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

  private bolt: Bolt | any;
  private stack: any[];

  private corpus = H.deepFreezeCreate({
      step1: { category: 'verb', host: null, method: async function step1 (...args: any) { console.log('now step1', args); return await wait.apply(this, args); }},
      step2: { category: 'verb', host: null, method: async function step2 (...args: any) { console.log('now step2', args); return await wait.apply(this, args); }},
      step3: { category: 'verb', host: null, method: async function step3 (...args: any) { console.log('now step3', args); return await wait.apply(this, args); }},
  }) as any;

  constructor (bolt: Bolt | any) {
    this.bolt = bolt;
  }

  findInCorpus (lemma: string) {

    const instruction =  this.corpus[lemma];

    return instruction
      ? { category: instruction.category, instruction }
      : { category: null, instruction: null }
    ;

  }

  execute () {

    const self  = this;
    const world = {};

    this.stack = [] as any;

    const proxy = new Proxy(world, {
      get (world: any, lemma: string ) {

        const { category, instruction } = self.findInCorpus(lemma);

        if ( lemma === 'end') {
          return self.finish();

        } else if ( instruction ) {
          return (...args: any) => {
            self.stack.push(instruction.method.bind(instruction.host, ...args));
            return proxy;
          };

        } else {
          throw "Scripter: Instruction '" + lemma + "' is not a valid script instruction";

        }

      },
    }) as any;

    return proxy;

  }

  finish () {
    return new Promise( async (resolve, reject) => {

      try {
        for ( const instruction of this.stack ){
          await instruction();
        }
        resolve(true);
        console.log('Done');

      } catch (err) {
        reject(err);

      }

    });

  }

}
