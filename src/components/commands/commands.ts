import m from "mithril";
import './commands.scss';

import Factory      from '../factory';
import { Bolts }  from '../../devices/bolt/bolts';
import { Bolt }   from '../../devices/bolt/bolt';

const BoltCommands = Factory.create('Layout', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const className = bolt.name

    return  ( !bolt.connected
      ? m('div.commands.w-100.pa2', { className }, m('[', [
          m('div.di.ma2.f3.mono', bolt.name),
          m('span.ml3.f5.mono', `Connecting: rssi: ${bolt.status.rssi}, txPOwer: ${bolt.status.txPower}`)
        ]))
      : m('div.commands.w-100.pa2', { className }, [
          m('div.di.f3.ma2.mono', bolt.name),
          m('button.br2.mh1.cmd', { onclick: () => Bolts.disconnectBolt(bolt) },                         'Disconnect'),
          m('button.br2.mh1.cmd', { onclick: bolt.actuators.sleep.bind(bolt.actuators) },                'Sleep'),
          m('button.br2.mh1.cmd', { onclick: bolt.actuators.wake.bind(bolt.actuators) },                 'Wake'),
          m('button.br2.mh1.cmd', { onclick: bolt.reset.bind(bolt) },                                    'Reset'),
          m('button.br2.mh1.cmd', { onclick: bolt.calibrate.bind(bolt) },                                'Calibrate'),
          m('button.br2.mh1.cmd', { onclick: bolt.action.bind(bolt) },                                   'Action'),
          m('button.br2.mh1.cmd', { onclick: bolt.stress.bind(bolt) },                                   'Stress'),
          m('button.br2.mh1.cmd', { onclick: bolt.sensors.info.bind(bolt.sensors) },                     'Info'),

          m('span.mono.pl2.cfff', 'Stab'),
          m('button.br2.mh1.cmd', { onclick: bolt.actuators.stabilizeFull.bind(bolt.actuators) },        'Full'),
          m('button.br2.mh1.cmd', { onclick: bolt.actuators.stabilizeNone.bind(bolt.actuators) },        'Off'),

          m('span.mono.pl2.cfff', 'Sensor'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.sensors.enableSensorsAll() },                    'On'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.sensors.disableSensors() },                      'Off'),

          m('span.mono.pl2.cfff', 'Roll'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.roll(25,   0) },                       '▲'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.roll(25, 270) },                       '◀'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.roll(25,  90) },                       '▶'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.roll(25, 180) },                       '▼'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.roll(0,    0) },                       '▣'),

          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.rotate(-30) },                         '↰'),
          m('button.br2.mh1.cmd', { onclick: bolt.actuators.piroutte.bind(bolt.actuators) },             '↻'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.rotate(+30) },                         '↱'),
          m('button.br2.mh1.cmd', { onclick: () => bolt.actuators.roll(25, bolt.heading) },              '↑'),

        ])
    );

  },

});

export { BoltCommands };
