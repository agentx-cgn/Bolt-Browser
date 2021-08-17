import m from "mithril";

import './streamer.scss';

import Factory     from '../factory';

import * as SimplePeer from 'simple-peer';


const Streamer = Factory.create('Streamer', {

  reset () {
    this.peer = {} as  SimplePeer.Instance;
  },

  view( vnode: any ) {

    const width = vnode.attribs.width;

    return m('div.streamer.w-100',
        m('div'),
    );
  },

});

export { Streamer };
