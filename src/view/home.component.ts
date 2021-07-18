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
  }

  disconnect () {}

  view (  ) { 

    return m('[', [
      m('div.w-100',     'HOME'),
      m('div.w-100',     this.bolts.map( (device:any) => {
        return m('div', device.name);
      })),
      m('div.w-100',     [
        m('button', { onclick: this.bolts.pair.bind(this.bolts) }, 'Pair'),
      ]),
      m('div.w-100',     [
        m('button', { onclick: this.disconnect }, 'DisConnect')
      ]),
    ]);

  }

};


export { HomeComponent };