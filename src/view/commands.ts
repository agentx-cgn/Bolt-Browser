import m from "mithril";

import './commands.scss';

// // import { H }        from '../view/services/helper';
import Factory      from '../components/factory';

import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';
import { IAction } from "./../devices/bolt/interfaces";

function setMatrixRandomColor(name: string) {
  const bolt: Bolt = Bolts.find((bolt:Bolt) => bolt.name === name)
  bolt.actuators.setMatrixRandomColor();
}
  
function action(name: string) {
  Bolts.find((bolt:Bolt) => bolt.name === name).action();
}

const BoltCommands = Factory.create('Layout', {


  view( vnode: any ) {

    const { bolt } = vnode.attrs;
    const style = `backcolor: ${ bolt.config.colors.backcolor }`;

    return  (
      m('div.w-100', { style }, [
        m('span.pa1.f3.mono', bolt.name),
        m('button.mh1.cmd', { onclick: () => Bolts.disconnect(bolt) },                         'disconnect'),
        m('button.mh1.cmd', { onclick: bolt.reset.bind(bolt) },                                'reset'),
        m('button.mh1.cmd', { onclick: bolt.actuators.info.bind(bolt.actuators) },             'info'),
        m('button.mh1.cmd', { onclick: bolt.configure.bind(bolt) },                            'configure'),
        m('button.mh1.cmd', { onclick: () => action(bolt.name) },                              'Action'),
        m('button.mh1.cmd', { onclick: () => setMatrixRandomColor(bolt.name) },                'RndCol'),
        m('button.mh1.cmd', { onclick: bolt.actuators.sleep.bind(bolt.actuators) },            'Sleep'),
        m('button.mh1.cmd', { onclick: bolt.actuators.wake.bind(bolt.actuators) },             'Wake'),
        m('button.mh1.cmd', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 0) },    'Head 0'),
        m('button.mh1.cmd', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 180) },  'Head 180'),
        m('button.mh1.cmd', { onclick: bolt.actuators.resetYaw.bind(bolt.actuators, 180) },    'yaw' + bolt.heading),
      ])
    );

  },

});

export { BoltCommands };