import m from "mithril";
import './streamer.scss';
import Factory     from '../../components/factory';
import Peer  from 'simple-peer-light';

const Streamer = Factory.create('Streamer', {

  enumDevices () {

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("Streamer.enumerateDevices() not supported.");
      return Promise.resolve(true);
    }

    return navigator.mediaDevices.enumerateDevices()
      .then(function(devices) {
        devices.filter( dev => dev.kind === 'videoinput').forEach(function(device) {
          console.log(device.label, device.deviceId);
        });
        // return Promise.resolve(true);
      })
      .catch(function(err) {
        console.log(err.name + ": " + err.message);
      })
    ;

  },

  gotMedia (stream: any) {

    const initiator = true;

    const peer = new Peer({
      initiator,
      channelName: '123456789',
      config: {
        iceServers: [],
        // iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }]
      },
    });

    console.log('Streamer.gotMedia', 'Initiator', stream);

    const player = document.querySelector('#video1') as HTMLVideoElement;

    if ('srcObject' in player) {
      player.srcObject = stream
    } else {
      player.src = window.URL.createObjectURL(stream) // for older browsers
    }

    player.play();

    peer.on('error', (err: any) => console.log('Streamer.error', err))

    peer.on('signal', (data: any) => {
      console.log('Streamer.signal', data.offer, );
      // peer2.signal(data)
    })

    peer.on('connect', (...args: any) => {
      console.log('Streamer.connect', args);
      // peer1.signal('huhu');
    })

    peer.on('stream', (...args: any) => {
      console.log('Streamer.stream', args);
      // peer1.signal('huhu');
    })

  },

  oninit () {

    const constraints = {
      video: { width: 1200, height: 800, facingMode: { exact: "environment" } }
    }

    Streamer.enumDevices()
      .then( () => navigator.mediaDevices.getUserMedia(constraints))
      .then(Streamer.gotMedia)
      .catch((err: any) => { console.log(err)})
    ;

  },

  view( vnode: any ) {

    const style = { backgroundColor: '#987'}

    const ip = screen.width < 400 ? '192.168.2.134' : '192.168.2.144';

    return m('div.streamer.w-100', { style }, [
        m('div.commands.w-100.pa2', { }, m('[', [
          m('button.br2.mr3.ml1.cmd', { onclick: () => { Streamer.reset() } },    'Reset'),
        ])),
        m('video#video1', {width: 320, height: 240}),
    ]);
  },

});

export { Streamer };
