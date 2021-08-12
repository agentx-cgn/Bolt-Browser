
import m from "mithril";

// import { H }        from '../view/services/helper';

import Factory from '../components/factory';
import { Bolt } from './../devices/bolt/bolt';
import { IAction } from "./../devices/bolt/interfaces";

function sortQueue (a: IAction, b: IAction) {
  return b.timestamp - a.timestamp;
}

const BoltLogger = Factory.create('Logger', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const style = { background: bolt.config.colors.backcolor + '88', height: '60px', overflowY: 'scroll' };

    return m('div.logger.w-100.code.f7.pa1.pl3', { style }, bolt.queue.sort(sortQueue).map( (cmd: IAction) => {
      return m('div', [
        m('span.ph1', cmd.bolt.name),
        m('span.ph1', cmd.id),
        m('span.ph1', cmd.executed     ? 'I' : 'O'),
        m('span.ph1', cmd.acknowledged ? 'I' : 'O'),
        m('span.ph1', cmd.name),
        m('span.ph1', cmd.command.join(' ')),
      ]);
    }));

  }

});

export { BoltLogger };
