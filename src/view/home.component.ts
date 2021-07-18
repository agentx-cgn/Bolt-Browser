import m from "mithril";

import { Bluetooth } from '../services/bluetooth/bluetooth.service';


const HomeComponent = {

  oninit ( ) {

    async () => {
      const test = await Bluetooth.connect();      
    }

  
  },
  view (  ) { 

    return m('[', [
      m('div.w-100',     'HOME'),
      m('div.w-100',     [
        m('button', { onclick: Bluetooth.connect() }, 'Connect'),
        m('button', { onclick: Bluetooth.disconnect() }, 'DisConnect')
      ]),
    ]);

  }

};


export { HomeComponent };