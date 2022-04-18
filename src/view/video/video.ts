import m from "mithril";

// import './streamer.scss';

import Factory     from '../../components/factory';

// import SimplePeer from 'simple-peer';
import Peer  from 'simple-peer-light';

const initiator = screen.width > 400;

const Video = Factory.create('Video', {

  reset () {
    // this.peer = {} as SimplePeer.Instance;

    // get video/voice stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(gotMedia)
      .catch((err) => { console.log(err)})
    ;

    function gotMedia (stream: any) {


      const initiator = screen.width > 400;

      const peer1 = new Peer({ initiator, stream: stream })
      const peer2 = new Peer()

      console.log('gotMedia', 'Initiator', initiator);

      peer1.on('error', (err: any) => console.log('peer1.error', err))
      peer2.on('error', (err: any) => console.log('peer2.error', err))

      peer1.on('signal', (data: any) => {
        console.log('peer1.signal');
        peer2.signal(data)
      })

      peer2.on('signal', (data: any) => {
        console.log('peer2.signal');
        peer1.signal(data)
      })

      peer1.on('connect', () => {
        console.log('peer1.connect');
        // peer1.signal('huhu');
      })
      peer2.on('connect', () => {
        console.log('peer2.connect');
        // peer1.signal('huhu');
      })

      peer2.on('stream', (stream: any) => {
        // got remote video stream, now let's show it in a video tag
        console.log('peer2.stream');
        var video = document.querySelector('#video1') as HTMLVideoElement;

        if ('srcObject' in video) {
          video.srcObject = stream
        } else {
          video.src = window.URL.createObjectURL(stream) // for older browsers
        }

        video.play();

      })

      initiator && console.log('Iniator.waiting...')
      !initiator && console.log('NOT Iniator.waiting...')


    }



  },

  connect (ip: string) {

    console.log('Streamer.connect', ip);

    const initiator = false;

    const peer = new Peer({
      trickle: false,
      channelName: '123456789',
      config: {
        iceServers: [],
        // iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }]

      },
    });

    console.log('connect', 'Initiator', initiator);

    peer.on('error', (err: any) => console.log('Video.error', err))

    peer.on('signal', (data: any) => {
      console.log('Video.signal', data);
    })

    peer.on('connect', (data: any) => {
      console.log('Video.connect', data);
      // peer1.signal('huhu');
    })

    peer.on('stream', (...args: any) => {
      console.log('Video.stream', args);
      // peer1.signal('huhu');
    })

  },

  // oninit () {

  //   if

  // },

  view( vnode: any ) {

    const ips = {
      canary:  '192.168.2.134',
      airbook: '192.168.2.136',
      galaxy:  '192.168.2.144',
    };

    const style = { backgroundColor: '#789'}

    return m('div.streamer.w-100', { style }, [

        m('div.commands.w-100.pa2', { }, m('[', [
          m('button.br2.mr3.ml1.cmd', { onclick: () => { Video.reset() } },    'Reset'),

          m('input#ip.tc.mono.ph1', { value: ips.canary, style: { width: '128px', backgroundColor: '#FFFC', borderRadius: '3px', border: '1px solid white' }}),
          m('button.br2.mh1.cmd', { onclick: () => { Video.connect((document.getElementById('ip') as HTMLInputElement).value) } },    'Canary'),

        ])),
        m('video#video1', {width: 320, height: 240}),
    ]);
  },

});

export { Video };
