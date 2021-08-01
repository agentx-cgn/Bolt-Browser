import m from "mithril";

import './commands.scss';

// import { H }        from '../view/services/helper';
import Factory      from '../components/factory';

import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';

const BoltCommands = Factory.create('Layout', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const style = { background: bolt.config.colors.backcolor };

    // https://www.w3schools.com/charsets/ref_utf_arrows.asp
    // ⇧⇦⇨⇩

    return  (
      m('div.w-100', { style }, [
        m('span.pa1.f3.mono', bolt.name),
        m('button.mh1.cmd', { onclick: () => Bolts.disconnect(bolt) },                         'Disconnect'),
        m('button.mh1.cmd', { onclick: bolt.actuators.sleep.bind(bolt.actuators) },            'Sleep'),
        m('button.mh1.cmd', { onclick: bolt.actuators.wake.bind(bolt.actuators) },             'Wake'),
        m('button.mh1.cmd', { onclick: bolt.reset.bind(bolt) },                                'Reset'),
        m('button.mh1.cmd', { onclick: bolt.action.bind(bolt) },                               'Action'),
        m('button.mh1.cmd', { onclick: bolt.configure.bind(bolt) },                            'Configure'),
        m('button.mh1.cmd', { onclick: bolt.actuators.info.bind(bolt.actuators) },             'Info'),
        m('button.mh1.cmd', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 0) },    'Head 0'),
        m('button.mh1.cmd', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 180) },  'Head 180'),

        m('button.mh1.cmd', { onclick: bolt.actuators.piroutte.bind(bolt.actuators) },         '↺↻'),
        m('button.mh1.cmd', { onclick: bolt.actuators.stabilizeNone.bind(bolt.actuators) },         'Stab OFF'),
        m('button.mh1.cmd', { onclick: bolt.actuators.stabilizeFull.bind(bolt.actuators) },         '⛢'),

        m('button.mh1.cmd', { onclick: () => bolt.actuators.enableSensors() },                 'Sensor ON'),
        m('button.mh1.cmd', { onclick: () => bolt.actuators.disableSensors() },                'Sensor OFF'),

        m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25,   0) },                '▲'),
        m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25, 270) },                '◀'),
        m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25,  90) },                '▶'),
        m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(25, 180) },                '▼'),
        m('button.mh1.cmd', { onclick: () => bolt.actuators.roll(0,    0) },                '◾'),


        // m('button.mh1.cmd', { onclick: bolt.actuators.setMatrixRandomColor.bind(bolt) },       'RndCol'),
        // m('button.mh1.cmd', { onclick: bolt.actuators.resetYaw.bind(bolt.actuators, 180) },    'Yaw' + bolt.heading),
      ])
    );

  },

});

export { BoltCommands };
