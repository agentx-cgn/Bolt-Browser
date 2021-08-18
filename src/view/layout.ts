import './layout.scss';
import m from "mithril";

import { Header }       from '../components/header/header';
import { Backdrop }     from '../components/backdrop';
import { Plotter }     from '../components/plotter/plotter';
import { Last }         from '../components/last';
import Factory      from '../components/factory';

import { Bolts }  from './../devices/bolt/bolts';

Bolts.activate();
Bolts.searchBolts();
Plotter.reset();

const Layout = Factory.create('Layout', {

  view( vnode: any ) {

    const { route, params } = vnode.attrs;

    const style = { background: '#ddd', flex: 1, maxWidth: '180px', overflow: 'hidden' };

    return m('div.layout', [

      m(Backdrop),
      m(Header, { route, params }),
      m("section", vnode.children),
      m(Last, { msecs: Date.now() }),

    ]);

  },

});

export { Layout };
