// import './layout.scss';
import m from "mithril";

// // import { H }        from '../view/services/helper';
import { Header }       from '../components/header/header';
import { Backdrop }     from '../components/backdrop';
import { Canvas }     from '../components/canvas';
// import { Nothing }  from './components/misc';
import { Last }         from '../components/last';
import Factory      from '../components/factory';
// import Pages        from './pages/pages';

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

function sortQueue (a: IAction, b: IAction) {
  return b.id - a.id;
}

const LayoutComponent = Factory.create('Layout', {

    view( vnode: any ) {

        const { route, params } = vnode.attrs;
        // const [ Page, Section ] = vnode.children;

        return m('div.layout', [
            m(Backdrop),
            m(Header, { route, params }),

            m('div.w-100.bg-gold.pa2',     Bolts.map( (bolt: Bolt) => {
              return m('div.w-100', [
                m('span.pa1.f3', bolt.name),
                m('button.mh1', { onclick: bolt.reset.bind(bolt) },                             'reset'),
                m('button.mh1', { onclick: bolt.info.bind(bolt) },                                'info'),
                m('button.mh1', { onclick: bolt.config.bind(bolt) },                              'config'),
                m('button.mh1', { onclick: () => action(bolt.name) },                             'Action'),
                m('button.mh1', { onclick: () => setMatrixRandomColor(bolt.name) },               'RndCol'),
                m('button.mh1', { onclick: () => Bolts.disconnect(bolt) },                        'DisConnect'),
                m('button.mh1', { onclick: bolt.actuators.sleep.bind(bolt.actuators) },           'Sleep'),
                m('button.mh1', { onclick: bolt.actuators.wake.bind(bolt.actuators) },            'Wake'),
                m('button.mh1', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 0) },   'Head 0'),
                m('button.mh1', { onclick: bolt.actuators.setHeading.bind(bolt.actuators, 180) }, 'Head 180'),
                m('button.mh1', { onclick: bolt.actuators.resetYaw.bind(bolt.actuators, 180) },    'yaw' + bolt.heading),
              ]);
            })),

            m('div.w-100.bg-light-green.pa2.f6', Bolts.map( (bolt: Bolt) => {
              return m('div.w-100.code', {style: 'max-height: 80px; overflow-y: scroll'}, bolt.queue.sort(sortQueue).map( (cmd: IAction) => {
                return m('div', [
                  m('span.ph1', cmd.bolt.name),
                  m('span.ph1', cmd.id),
                  m('span.ph1', cmd.executed     ? 'I' : 'O'),
                  m('span.ph1', cmd.acknowledged ? 'I' : 'O'),
                  m('span.ph1', cmd.name),
                  m('span.ph1.washed-blue', cmd.command.join(' ')),
                ]);
              }));
            })),

            m('div.w-100.bg-lightest-blue.pa2.f6', {}, [
              m(Canvas)
            ]),

            // m('div.w-100.bg-lightest-blue.pa2.f6', Bolts.map( (bolt: Bolt) => {
            //   return m('div.w-100.code', {style: 'max-height: 128px'}, [
            //     m('canvas', {width: 128, height: 128, style: 'background-color: #888'}),
            //   ])
            // })),

            m(Last, { msecs: Date.now() }),
        ]);

    },

});

export { LayoutComponent };