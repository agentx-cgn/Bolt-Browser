import m from "mithril";

// import './status.scss';

// import { H }        from '../view/services/helper';
import Factory      from '../components/factory';

// import { Bolts }  from './../devices/bolt/bolts';
import { Bolt }   from './../devices/bolt/bolt';

const BoltStatus = Factory.create('Layout', {

  view( vnode: any ) {

    const bolt: Bolt = vnode.attrs.bolt;
    const style = { background: bolt.config.colors.backcolor, flex: 1 };

    return  (
      m('pre.f7.mono.ceee.pa2', { style }, JSON.stringify(bolt.status, null, 2))
    );

  },

});

export { BoltStatus };
