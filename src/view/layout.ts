// import './layout.scss';
import m from "mithril";

// // import { H }        from '../view/services/helper';
import { Header }       from '../components/header/header';
import { Backdrop }     from '../components/backdrop';
import { Plotter }     from '../components/plotter';
// import { Nothing }  from './components/misc';
import { Last }         from '../components/last';
import Factory      from '../components/factory';

import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';
import { BoltCommands } from './commands';
import { BoltLogger } from './logger';
import { BoltStatus } from './status';

Bolts.activate();

const LayoutComponent = Factory.create('Layout', {

  view( vnode: any ) {

    const { route, params } = vnode.attrs;

    return m('div.layout', [

      m(Backdrop),
      m(Header, { route, params }),

      m('div.w-100', Bolts.map( (bolt: Bolt) => {
        return [
          m(BoltCommands, { bolt }),
          m(BoltLogger,   { bolt }),
        ];
      })),

      m('div.w-100.bg-eee.f6.flex.flex-row', {}, [
        m(Plotter, {size: 512} ),
        Bolts.map(( bolt: Bolt ) => m(BoltStatus, { bolt }) ),
      ]),

      m(Last, { msecs: Date.now() }),

    ]);

  },

});

export { LayoutComponent };
