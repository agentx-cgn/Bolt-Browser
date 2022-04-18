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

const Links = Factory.create('Links', {

  view( vnode: any ) {

    const { route, params } = vnode.attrs;

    const style = { color: '#fff', textDecoration: 'none' };

    return m('div.w-100.bg-333', { }, [
      m('div.di.ph2.ma3', m(m.route.Link, { style, class: 'mono', href: '/'         }, 'Home') ),
      m('div.di.ph2.ma3', m(m.route.Link, { style, class: 'mono', href: '/streamer' }, 'Streamer') ),
      m('div.di.ph2.ma3', m(m.route.Link, { style, class: 'mono', href: '/video'    }, 'Video') ),
      m('a.di.ph2.ma3', { style, class: 'mono', target: '_blank', href: 'chrome://bluetooth-internals/#devices'    }, 'Internals') ,
    ]);

  },

});

const Layout = Factory.create('Layout', {

  view( vnode: any ) {

    const { route, params } = vnode.attrs;

    const style = { background: '#ddd', flex: 1, maxWidth: '180px', overflow: 'hidden' };

    return m('div.layout', [

      m(Backdrop),
      m(Links, { route, params }),
      m(Header, { route, params }),
      m("section", vnode.children),
      m(Last, { msecs: Date.now() }),

    ]);

  },

});

export { Layout };
