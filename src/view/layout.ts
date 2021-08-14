// import './layout.scss';
import m from "mithril";

// // import { H }        from '../view/services/helper';
import { Header }       from '../components/header/header';
import { Backdrop }     from '../components/backdrop';
import { Plotter }     from '../components/plotter';
import { Panel }     from './panel';
// import { Nothing }  from './components/misc';
import { Last }         from '../components/last';
import Factory      from '../components/factory';

import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';
import { BoltCommands } from './commands';
import { Logger } from './logger';
import { BoltStatus } from './status';

Bolts.activate();
Bolts.searchBolts();
Plotter.reset();
// document.hasFocus()

const LayoutComponent = Factory.create('Layout', {

  view( vnode: any ) {

    const { route, params } = vnode.attrs;

    const style = { background: '#ddd', flex: 1, maxWidth: '180px', overflow: 'hidden' };


    return m('div.layout', [

      m(Backdrop),
      m(Header, { route, params }),

      m('div.bolts.w-100', Bolts.map( (bolt: Bolt) => m(BoltCommands, { bolt }) )),

      m('div.panels.w-100.bg-eee.f6.flex.flex-row', {}, [

        m(Panel, {title: 'Plotter', width: '512px'}, [ m(Plotter, {size: 512} )]),

        m(Panel, {title: 'Logger', width: '800px' }, [ m(Logger,   {bolt: Bolts.get('SB-FAKE') }) ]),

        Bolts.map(( bolt: Bolt ) => {
          return m(Panel, {title: bolt.name + ' - Status', width: '128px'}, [ m(BoltStatus, { bolt }) ])
        }),

        m(Panel, {title: 'Meta', width: '128px'}, [ m('pre.plotterstatus.f7.mono.c333.pa2', { style }, JSON.stringify(Plotter.meta(), null, 2)) ]),

      ]),

      m(Last, { msecs: Date.now() }),

    ]);

  },

});

export { LayoutComponent };
