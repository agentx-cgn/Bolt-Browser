import m from "mithril";

import './commands.scss';

// import { H }        from '../view/services/helper';
import Factory      from '../components/factory';

import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';

const BoltCommands = Factory.create('Layout', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const style = { background: bolt.config.colors.backcolor, height: '34px' };

    // https://www.w3schools.com/charsets/ref_utf_arrows.asp
    // ⇧⇦⇨⇩

    return  ( !bolt.connected
      ? m('div.w-100', { style }, m('[', [
          m('span.mv3.f3.mono', bolt.name),
          m('span.pl3.f5.mono', `Connecting: rssi: ${bolt.status.rssi}, txPOwer: ${bolt.status.txPower}`)
        ]))
      : m('div.w-100', { style }, [
          m('span.mv3.f3.mono', bolt.name),
          m('button.mh1.cmd', { onclick: () => Bolts.disconnect(bolt) },                         'Disconnect'),
          m('button.mh1.cmd', { onclick: bolt.actuators.sleep.bind(bolt.actuators) },            'Sleep'),
          m('button.mh1.cmd', { onclick: bolt.actuators.wake.bind(bolt.actuators) },             'Wake'),
          m('button.mh1.cmd', { onclick: bolt.reset.bind(bolt) },                                'Reset'),
          m('button.mh1.cmd', { onclick: bolt.action.bind(bolt) },                               'Action'),
          m('button.mh1.cmd', { onclick: bolt.configure.bind(bolt) },                                '⚙'),
          m('button.mh1.cmd', { onclick: bolt.actuators.info.bind(bolt.actuators) },             'Info'),
          // m('button.mh1.cmd', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 0) },    'Head 0'),
          // m('button.mh1.cmd', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 180) },  'Head 180'),

          m('span.mono.pl2.cfff', 'Stab'),
          m('button.mh1.cmd', { onclick: bolt.actuators.stabilizeFull.bind(bolt.actuators) },        'Full'),
          m('button.mh1.cmd', { onclick: bolt.actuators.stabilizeNone.bind(bolt.actuators) },        'Off'),

          m('span.mono.pl2.cfff', 'Sensor'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.enableSensorsAll() },                  'On'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.disableSensors() },                    'Off'),

          m('span.mono.pl2.cfff', 'Roll'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25,   0) },                       '▲'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25, 270) },                       '◀'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25,  90) },                       '▶'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25, 180) },                       '▼'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(0,    0) },                       '◾'),

          m('button.mh1.cmd', { onclick: () => bolt.actuators.rotate(-30) },                         '↰'),
          m('button.mh1.cmd', { onclick: bolt.actuators.piroutte.bind(bolt.actuators) },             '↻'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.rotate(+30) },                         '↱'),
          m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25, bolt.heading) },              '↑'),


          // m('button.mh1.cmd', { onclick: bolt.actuators.setMatrixRandomColor.bind(bolt) },       'RndCol'),
          // m('button.mh1.cmd', { onclick: bolt.actuators.resetYaw.bind(bolt.actuators, 180) },    'Yaw' + bolt.heading),
        ])
    );

  },

});

export { BoltCommands };
