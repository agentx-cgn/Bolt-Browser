import m from "mithril";

import  { Bolts }  from '../devices/bolt/bolts';
import  { Bolt }   from '../devices/bolt/bolt';

const HomeComponent = class {

  private bolts;

  constructor (
  ) {
    this.bolts = Bolts;
    this.bolts.onUpdate(this.onUpdate.bind(this));
  }

  onUpdate () {
    m.redraw();
    console.log('REDRAW');
  }

  disconnect () {}

  setMatrixRandomColor(name: string) {
    const bolt: Bolt = this.bolts.find(name);
    bolt.actuators.setMatrixRandomColor();
  }

  action(name: string) {
    this.bolts.find(name).action();
  }

  view (  ) { 

    return m('div.fl.w-100', [
      m('div.w-100.pointer.f2',     {onclick: m.redraw }, 'HOME', ),
      m('div.w-100.bg-gold.pa2',     this.bolts.map( (bolt:any) => {
        return m('div.w-100', [
          m('span.pa1.f3', bolt.name),
          m('button', { onclick: () => this.action(bolt.name) }, 'Action'),
          m('button', { onclick: () => this.setMatrixRandomColor(bolt.name) }, 'Colorize'),
          m('button', { onclick: this.bolts.disconnect.bind(this.bolts, bolt) }, 'DisConnect')
        ]);
      })),
      m('div.w-100.bg-light-blue.pa2',     [
        m('button', { onclick: this.bolts.pair.bind(this.bolts) }, 'Pair'),
        m('button', { onclick: this.bolts.disconnect.bind(this.bolts) }, 'DisConnect All'),
        m('button', { onclick: location.reload.bind(location) }, 'Reload'),
      ]),
      m('div.w-100',     [
      ]),
    ]);

  }

};


export { HomeComponent };