import m from "mithril";

import { Bolts }  from '../devices/bolt/bolts';
import { Bolt }   from '../devices/bolt/bolt';
import { IAction } from "../devices/bolt/interfaces";

const HomeComponent = class {

  private bolts;

  constructor (
  ) {
    this.bolts = Bolts;
  }

  disconnect () {}

  setMatrixRandomColor(name: string) {
    const bolt: Bolt = this.bolts.find((bolt:Bolt) => bolt.name === name)
    bolt.actuators.setMatrixRandomColor();
  }

  action(name: string) {
    this.bolts.find((bolt:Bolt) => bolt.name === name).action();
  }

  view (  ) {

    return m('div.fl.w-100', [
      m('div.w-100.bg-light-blue.pa2',     [
        m('div.f2.mr2.di', { onclick: m.redraw }, 'Home'),
        m('button.mh1', { onclick: this.bolts.pairBolt.bind(this.bolts) }, 'Pair'),
        m('button.mh1', { onclick: this.bolts.disconnect.bind(this.bolts) }, 'DisConnect All'),
        m('button.mh1', { onclick: location.reload.bind(location) }, 'Reload'),
      ]),

      m('div.w-100.bg-gold.pa2',     this.bolts.map( (bolt: Bolt) => {
        return m('div.w-100', [
          m('span.pa1.f3', bolt.name),
          m('button.mh1', { onclick: () => this.action(bolt.name) }, 'Action'),
          m('button.mh1', { onclick: () => this.setMatrixRandomColor(bolt.name) }, 'Colorize'),
          m('button.mh1', { onclick: this.bolts.disconnect.bind(this.bolts, bolt) }, 'DisConnect'),
          m('button.mh1', { onclick: bolt.actuators.sleep.bind(bolt.actuators) }, 'Sleep'),
          m('button.mh1', { onclick: bolt.actuators.wake.bind(bolt.actuators) }, 'Wake'),
          // m('button.mh1', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 0) }, 'Head 0'),
          // m('button.mh1', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 180) }, 'Head 180'),
          m('button.mh1', { onclick: bolt.actuators.resetYaw.bind(bolt.actuators, 180) }, 'resetYaw'),
        ]);
      })),

      m('div.w-100.bg-light-green.pa2.f6', this.bolts.map( (bolt:any) => {
        return m('div.w-100.code', bolt.queue.map( (cmd: IAction) => {
          return m('div', [
            m('span.ph1', cmd.bolt.name),
            m('span.ph1', cmd.id),
            m('span.ph1', cmd.executed     ? 'I' : 'O'),
            m('span.ph1', cmd.acknowledged ? 'I' : 'O'),
            m('span.ph1', cmd.name),
            m('span.ph1.washed-blue', cmd.bytes.join(' ')),
          ]);
        }));
      })),

    ]);

  }

};


export { HomeComponent };
