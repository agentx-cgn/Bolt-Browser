import m from "mithril";

import './streamer.scss';

import Factory     from '../../components/factory';

import SimplePeer from 'simple-peer';
// import * as SimplePeer from 'simple-peer';
// import * as Peer from 'simple-peer';


const Streamer = Factory.create('Streamer', {

  reset () {
    // this.peer = {} as SimplePeer.Instance;

    const internalIp = async () => {

      if (!RTCPeerConnection) {
          throw new Error("Not supported.")
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [{
          urls: "stun:stun.google.com:19302"
        }]
      });

      peerConnection.createDataChannel('')
      peerConnection.createOffer(peerConnection.setLocalDescription.bind(peerConnection))

      peerConnection.addEventListener("icecandidateerror", (error) => {
          console.log(error);
      })

      return new Promise(async resolve => {
          peerConnection.addEventListener("icecandidate", async ({candidate}) => {
              peerConnection.close()

              if (candidate && candidate.candidate) {
                  const result = candidate.candidate.split(" ")[4]
                  if (result.endsWith(".local")) {
                      const inputDevices = await navigator.mediaDevices.enumerateDevices()
                      const inputDeviceTypes = inputDevices.map(({ kind }) => kind)

                      const constraints = {} as any

                      if (inputDeviceTypes.includes("audioinput")) {
                          constraints.audio = true
                      } else if (inputDeviceTypes.includes("videoinput")) {
                          constraints.video = true
                      } else {
                          throw new Error("An audio or video input device is required!")
                      }

                      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
                      mediaStream.getTracks().forEach(track => track.stop())
                      resolve(internalIp())
                  }
                  resolve(result)
              }
          })
      })

    }

    // get video/voice stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(gotMedia)
      .then(() => internalIp())
      .then((stuff) => console.log(stuff))
      .catch((err) => { console.log(err)})
    ;

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

  connect (ip: string) {

    // 192.168.2.136 Airbook
    // 192.168.2.134 Canary
    // 192.168.2.144 Galaxy

    console.log('Streamer.connect', ip);
  },

  view( vnode: any ) {

    const style = { backgroundColor: '#789'}

    return m('div.streamer.w-100', { style }, [
        m('div.commands.w-100.pa2', { }, m('[', [
          m('button.br2.mr3.ml1.cmd', { onclick: () => { Streamer.reset() } },    'Reset'),
          m('input#ip.tc.mono.ph1', { value: '192.168.2.144', style: { width: '128px', backgroundColor: '#FFFC', borderRadius: '3px', border: '1px solid white' }}),
          m('button.br2.mh1.cmd', { onclick: () => { Streamer.connect((document.getElementById('ip') as HTMLInputElement).value) } },    'Connect'),
        ])),
        m('video#video1', {width: 320, height: 240}),
    ]);
  },

});

export { Streamer };
