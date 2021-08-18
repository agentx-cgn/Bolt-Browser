import m from "mithril";

import { Plotter }     from '../../components/plotter/plotter';
import { Panel }     from '../../components/panel';
import Factory      from '../../components/factory';

import { Bolts }  from '../../devices/bolt/bolts';
import { Bolt }   from '../../devices/bolt/bolt';
import { BoltCommands } from '../../components/commands/commands';
import { Logger } from '../../components/logger/logger';
import { BoltStatus } from '../../components/status';

const Home = Factory.create('Home', {

  oninit ( ) {
  },

  view (  ) {

    return m('[', [
      m('div.bolts.w-100', Bolts.map( (bolt: Bolt) => m(BoltCommands, { bolt }) )),

      m('div.panels.w-100.bg-eee.f6.flex.flex-row', {}, [

        m(Panel, {title: 'Plotter', width: '512px'},
          m(Plotter, {size: 512} )
        ),
        m(Panel, {title: 'Logger', width: '768px' },
          m(Logger,  {bolt: Bolts.get('SB-FAKE') })
        ),
        Bolts.map(( bolt: Bolt ) => {
          return m(Panel, {title: bolt.name + ' - Status', width: '200px'}, [ m(BoltStatus, { bolt }) ])
        }),
        // m(Panel, {title: 'Meta', width: '164px'}, [
        //   m('pre.plotterstatus.f7.mono.c333.pa2', { style },
        //   JSON.stringify(Plotter.meta(), null, 2))
        // ]),

      ]),
    ]);

  }

});


export { Home };
