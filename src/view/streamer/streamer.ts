import m from "mithril";

import './streamer.scss';

import Factory     from '../../components/factory';

import SimplePeer from 'simple-peer';
// import * as SimplePeer from 'simple-peer';
// import * as Peer from 'simple-peer';


const Streamer = Factory.create('Streamer', {

  reset () {
    this.peer = {} as SimplePeer.Instance;

    // get video/voice stream
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(gotMedia).catch(() => {})

    function gotMedia (stream: any) {
      var peer1 = new SimplePeer({ initiator: true, stream: stream })
      var peer2 = new SimplePeer()

      peer1.on('signal', data => {
        peer2.signal(data)
      })

      peer2.on('signal', data => {
        peer1.signal(data)
      })

      peer2.on('stream', stream => {
        // got remote video stream, now let's show it in a video tag
        var video = document.querySelector('#video1') as HTMLVideoElement;

        if ('srcObject' in video) {
          video.srcObject = stream
        } else {
          video.src = window.URL.createObjectURL(stream) // for older browsers
        }

        video.play();

      })
    }



  },

  view( vnode: any ) {

    // const width = vnode.attribs.width;

    return m('div.streamer.w-100',
        m('video#video1', {width: 320, height: 240}),
    );
  },

});

export { Streamer };
