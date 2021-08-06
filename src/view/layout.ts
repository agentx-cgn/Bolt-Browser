// import './layout.scss';
import m from "mithril";

// // import { H }        from '../view/services/helper';
import { Header }       from '../components/header/header';
import { Backdrop }     from '../components/backdrop';
import { Plotter }     from '../components/plotter';
// import { Nothing }  from './components/misc';
import { Last }         from '../components/last';
import Factory      from '../components/factory';
// import Pages        from './pages/pages';

import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';
import { IAction } from "./../devices/bolt/interfaces";

import { BoltCommands } from './commands';
import { BoltStatus } from './status';

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

            m('div.w-100', Bolts.map( (bolt: Bolt) => {

              const style = { backgroundColor: bolt.config.colors.backcolor + '88', maxHeight: '80px', overflowY: 'scroll' };

              return [
                m(BoltCommands, { bolt }),
                m('div.w-100.code.f7', { style }, bolt.queue.sort(sortQueue).map( (cmd: IAction) => {
                  return m('div', [
                    m('span.ph1', cmd.bolt.name),
                    m('span.ph1', cmd.id),
                    m('span.ph1', cmd.executed     ? 'I' : 'O'),
                    m('span.ph1', cmd.acknowledged ? 'I' : 'O'),
                    m('span.ph1', cmd.name),
                    m('span.ph1.washed-blue', cmd.command.join(' ')),
                  ]);
                }))
              ];
            })),

            m('div.w-100.bg-eee.f6.flex.flex-row', {}, [
              m(Plotter, {size: 512} ),
              Bolts.map(( bolt: Bolt ) => m(BoltStatus, { bolt }) ),
            ]),

            m(Last, { msecs: Date.now() }),
        ]);

    },

});

export { LayoutComponent };
