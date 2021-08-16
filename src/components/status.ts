import m from "mithril";

// import './status.scss';
// import { H }        from '../view/services/helper';

import Factory from './factory';
import { Bolt } from '../devices/bolt/bolt';

const BoltStatus = Factory.create('BoltStatus', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const style = { background: bolt.config.colors.backcolor + '88', flex: 1, maxWidth: '200px', overflow: 'hidden' };

    return (
      m('pre.boltstatus.f7.mono.c333.pa2.w-100', { style }, JSON.stringify(bolt.status, null, 2))
    );

  },

});

export { BoltStatus };
