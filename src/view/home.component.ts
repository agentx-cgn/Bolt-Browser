import m from "mithril";

import  { Bolts }  from '../devices/bolt/bolts';

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

  view (  ) { 

    return m('div.fl.w-100', [
      m('div.w-100.pointer',     {onclick: m.redraw }, 'HOME', ),
      m('div.w-100.bg-gold.p3',     this.bolts.map( (bolt:any) => {
        return m('div.w-100', [
          m('div', bolt.name),
          m('button', { onclick: this.bolts.disconnect.bind(this.bolts, bolt) }, 'DisConnect')
        ]);
      })),
      m('div.w-100',     [
        m('button', { onclick: this.bolts.pair.bind(this.bolts) }, 'Pair'),
      ]),
      m('div.w-100',     [
        m('button', { onclick: this.bolts.disconnect.bind(this.bolts) }, 'DisConnect')
      ]),
    ]);

  }

};


export { HomeComponent };