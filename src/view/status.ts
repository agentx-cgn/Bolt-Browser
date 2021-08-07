import m from "mithril";

// import './status.scss';
// import { H }        from '../view/services/helper';

import Factory from '../components/factory';
import { Bolt } from './../devices/bolt/bolt';

const BoltStatus = Factory.create('Layout', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const style = { background: bolt.config.colors.backcolor + '88', flex: 1, maxWidth: '180px', overflow: 'hidden' };

    return (
      m('pre.f7.mono.c333.pa2', { style }, JSON.stringify(bolt.status, null, 2))
    );

  },

});

export { BoltStatus };
