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

    const reload = (e:any) => { window.location.reload(); };

    return m('header.w-100.pa2', {style: {backgroundColor: '#949494'} },
      m('[',[
        m('div.f3.di.mono.cfff.ma2', 'Bolts  '),
        m('button.cmd.br2.ml1', { onclick: Bolts.pairBolt.bind(Bolts) }, 'Pair'),
        m('button.cmd.br2.ml1', { onclick: Bolts.disconnectall.bind(Bolts) }, 'DisConnect'),
        m('button.cmd.br2.ml1', { onclick: reload },   'Reload'),
        m('button.cmd.br2.ml1', { onclick: m.redraw }, 'Redraw'),
      ]),
    );
  },
});

export { Header };
