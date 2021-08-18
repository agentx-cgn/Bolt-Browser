import './header.scss';
import m from "mithril";

import Factory     from '../factory';
import { Bolts }  from '../../devices/bolt/bolts';
// import { Plotter } from '../plotter/plotter';
import { Bolt }   from '../../devices/bolt/bolt';

import iconBluetooth from './../../assets/bluetooth.icon.256.png';
import iconGreyBluetooth from './../../assets/bluetooth.icon.grey.256.png';

const Header = Factory.create('Header', {
  view( {attrs: {route, params}}:any ) {

    const links = m('[', [
      m(m.route.Link, { class: "", href: '/' }, 'Home'),
      m(m.route.Link, { class: "", href: '/streamer' }, 'Streamer'),
    ]);

    return m('header.w-100.pa2.bg-777',

      !Bolts.count()
        ? m('[',[
            m('div.f3.di.mono.cfff.ma2', m.trust('Bolts&nbsp;&nbsp;')),
            Bolts.hasBluetooth
              ? m('img', {src: iconBluetooth, width: 24 })
              : m('img', {src: iconGreyBluetooth, width: 24  }),
            m('button.cmd.br2.ml1', { onclick: Bolts.pairBolt.bind(Bolts) },                                    'Pair'),
            m('button.cmd.br2.ml1', { onclick: () => location.reload() },                                       'Reload'),
            links,
          ])
        : m('[',[
            m('div.f3.di.mono.cfff.ma2', m.trust('Bolts&nbsp;&nbsp;')),
            m('button.cmd.br2.ml1', { onclick: Bolts.pairBolt.bind(Bolts) },                                    'Pair'),
            m('button.cmd.br2.ml1', { onclick: Bolts.disconnect.bind(Bolts) },                               'DisConnect'),
            m('button.cmd.br2.ml1', { onclick: () => location.reload() },                                       'Reload'),
            m('button.cmd.br2.ml1', { onclick: m.redraw },                                                      'Redraw'),
            m('button.cmd.br2.ml1', { onclick: () => Bolts.reset() },                                           'Reset'),
            m('button.cmd.br2.ml1', { onclick: () => Bolts.forEach( (bolt: Bolt) => bolt.actuators.sleep() ) }, 'Sleep'),
            m('button.cmd.br2.ml1', { onclick: () => Bolts.forEach( (bolt: Bolt) => bolt.actuators.wake() ) },  'Wake'),
            links,
          ]

        ),
    );
  },
});

export { Header };
