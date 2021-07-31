import './header.scss';
import m from "mithril";

import Factory     from '../factory';
import { Bolts }  from '../../devices/bolt/bolts';

// import { Bolt }   from '../../devices/bolt/bolt';
// import { IAction } from "../../devices/bolt/interfaces";

// import screenfull  from 'screenfull';
// import System      from '../../data/system';
// import History     from '../../services/history';
// import Navigation  from './navigation';


const Header = Factory.create('Header', {
  view( {attrs: {route, params}}:any ) {

    // const toggle = (e) => {e.redraw = false; System.fullscreen && screenfull.toggle();};
    const reload = (e:any) => {e.redraw = false; window.location.reload();};

    return m('header.w-100',

      m('div.w-100.bg-ccc.pa2',     [
        m('div.f2.mr2.di', { onclick: m.redraw }, 'Home'),
        m('button.mh1', { onclick: Bolts.pairBolt.bind(Bolts) }, 'Pair'),
        m('button.mh1', { onclick: Bolts.disconnectall.bind(Bolts) }, 'DisConnect All'),
        m('button.mh1', { onclick: reload }, 'Reload'),
        m('button.mh1', { onclick: m.redraw }, 'Redraw'),
      ]),
    );
  },
});

export { Header };
