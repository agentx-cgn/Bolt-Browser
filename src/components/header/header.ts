import './header.scss';
import m from "mithril";

import { Bolts }  from '../../devices/bolt/bolts';
import { Bolt }   from '../../devices/bolt/bolt';
import { IAction } from "../../devices/bolt/interfaces";

// import screenfull  from 'screenfull';
// import System      from '../../data/system';
// import History     from '../../services/history';
import Factory     from '../factory';
// import Navigation  from './navigation';





const Header = Factory.create('Header', {
  view( {attrs: {route, params}}:any ) {

    // const toggle = (e) => {e.redraw = false; System.fullscreen && screenfull.toggle();};
    const reload = (e:any) => {e.redraw = false; window.location.reload();};
    const width  = innerWidth >=720 ? '360px' : '100vw';

    return m('header.w-100',

      m('div.w-100.bg-light-blue.pa2',     [
        m('div.f2.mr2.di', { onclick: m.redraw }, 'Home'),
        m('button.mh1', { onclick: Bolts.pairBolt.bind(Bolts) }, 'Pair'),
        m('button.mh1', { onclick: Bolts.disconnect.bind(Bolts) }, 'DisConnect All'),
        m('button.mh1', { onclick: location.reload.bind(location) }, 'Reload'),
        m('button.mh1', { onclick: m.redraw }, 'Redraw'),
      ]),

      m('div.controls.flex', { style: 'width:' + width }, [
          // m(Navigation, { route, params }),
          // History.canBack
          //     ? m('i.navi.fa.fa-angle-left',  { onclick: History.onback })
          //     : m('i.navi.fa.fa-angle-left.ctrans'),
          // History.canFore
          //     ? m('i.navi.fa.fa-angle-right', { onclick: History.onfore })
          //     : m('i.navi.fa.fa-angle-right.ctrans'),

        m('i.navi.fa.fa-retweet',           { onclick: reload }),
          //TODO: toggle the toggle
          // m('i.navi.fa.fa-expand-arrows-alt', { onclick: toggle }),
      ]),
    );
  },
});

export { Header };
