import './header.scss';
import m from "mithril";

import Factory     from '../factory';
import { Bolts }  from '../../devices/bolt/bolts';
import { Plotter } from '../plotter';
import { Bolt }   from '../../devices/bolt/bolt';

import iconBluetooth from './../../assets/bluetooth.icon.256.png';
import iconGreyBluetooth from './../../assets/bluetooth.icon.grey.256.png';

// import { IAction } from "../../devices/bolt/interfaces";

// import screenfull  from 'screenfull';
// import System      from '../../data/system';
// import History     from '../../services/history';
// import Navigation  from './navigation';


const Header = Factory.create('Header', {
  view( {attrs: {route, params}}:any ) {

    // const reload = (e:any) => { window.location.reload(); };

    return m('header.w-100.pa2', {style: {backgroundColor: '#949494'} },
      !Bolts.count()
        ? m('[',[
            m('div.f3.di.mono.cfff.ma2', 'Bolts  '),
            Bolts.hasBluetooth
              ? m('img', {src: iconBluetooth, width: 24 })
              : m('img', {src: iconGreyBluetooth, width: 24  }),
            m('button.cmd.br2.ml1', { onclick: Bolts.pairBolt.bind(Bolts) }, 'Pair'),
            m('button.cmd.br2.ml1', { onclick: () => location.reload() },                     'Reload'),
          ])
        : m('[',[
            m('div.f3.di.mono.cfff.ma2', 'Bolts  '),
            m('button.cmd.br2.ml1', { onclick: Bolts.pairBolt.bind(Bolts) },           'Pair'),
            m('button.cmd.br2.ml1', { onclick: Bolts.disconnectall.bind(Bolts) },      'DisConnect'),
            m('button.cmd.br2.ml1', { onclick: () => location.reload() },              'Reload'),
            m('button.cmd.br2.ml1', { onclick: m.redraw }, 'Redraw'),
            m('button.cmd.br2.ml1', { onclick: Plotter.reset.bind(Plotter) }, 'Plotter.reset'),
            m('button.cmd.br2.ml1', { onclick: () => Bolts.forEach( (bolt: Bolt) => bolt.reset() ) },           'reset'),
            m('button.cmd.br2.ml1', { onclick: () => Bolts.forEach( (bolt: Bolt) => bolt.actuators.sleep() ) }, 'sleep'),
            m('button.cmd.br2.ml1', { onclick: () => Bolts.forEach( (bolt: Bolt) => bolt.actuators.wake() ) },  'wake'),
          ]
        ),
    );
  },
});

export { Header };
