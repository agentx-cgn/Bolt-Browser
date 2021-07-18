import m from "mithril";

import  {Bluetooth}  from '../services/bluetooth/bluetooth.service';


const HomeComponent = class {

  private BT;

  constructor (
    // Bluetooth:any
  ) {
    this.BT = new Bluetooth();
  }

  disconnect () {}
  connect ( ) {

    console.log('connect');

    this.BT = new Bluetooth();

    (async () => {
      const devices = await this.BT.pair('SB-');      
      console.log(devices);
    })();

  
  }

  oninit () {
    this.BT.autopair('SB-')
      .then( () => {
        m.redraw();
      })
    ;
  }

  view (  ) { 

    return m('[', [
      m('div.w-100',     'HOME'),
      m('div.w-100',     this.BT.devices.map( (device:any) => {
        return m('div', device.name);
      })),
      m('div.w-100',     [
        m('button', { onclick: this.connect }, 'Pair'),
      ]),
      m('div.w-100',     [
        m('button', { onclick: this.disconnect }, 'DisConnect')
      ]),
    ]);

  }

};


export { HomeComponent };