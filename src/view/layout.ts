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
Bolts.searchBolts();
Plotter.reset();
// document.hasFocus()

const Panel = Factory.create('Panel', {

  view( vnode: any ) {

    let { title, width } = vnode.attrs;
    const childs = vnode.children;

    width = vnode.state.width ? vnode.state.width : width

    function toggleWidth () {
      if (!vnode.state.width || vnode.state.width === vnode.attrs.width) {
        width = vnode.state.width = '24px';
      } else {
        width = vnode.state.width = vnode.attrs.width;
      }
    }

    return m('div.panel', { style: { width, overflowX: 'hidden' } }, [
      m('div.bg-999.pa1.ceee.sans-serif.pointer',
        { style: { }, onclick: toggleWidth  },
        title
      ),
      ...childs
    ])

  }

});


const LayoutComponent = Factory.create('Layout', {

  view( vnode: any ) {

    const { route, params } = vnode.attrs;

    const style = { background: '#ddd', flex: 1, maxWidth: '180px', overflow: 'hidden' };


    return m('div.layout', [

      m(Backdrop),
      m(Header, { route, params }),

      m('div.w-100', Bolts.map( (bolt: Bolt) => {
        return [
          m(BoltCommands, { bolt }),
          // m(BoltLogger,   { bolt }),
        ];
      })),

      m('div.w-100.bg-eee.f6.flex.flex-row', {}, [

        m(Panel, {title: 'Plotter', width: '512px'}, [ m(Plotter, {size: 512} )]),

        m(Panel, {title: 'Logger', width: '800px' }, [ m(BoltLogger,   {bolt: Bolts.get('SB-FAKE') }) ]),

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
