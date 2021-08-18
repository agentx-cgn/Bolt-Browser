import m from 'mithril';

import 'tachyons/css/tachyons.min.css';
import './index.scss';

import { Layout } from './view/layout';
import { Home } from './view/home/home';
import { Streamer } from './view/streamer/streamer';

// import './services/aruco/cv.js';
// import './services/aruco/aruco.js';

// m.route(document.body, "/", {
//   "/": LayoutComponent
// })

m.route(document.body, '/', {
  '/': {
    render: function() {
      return m(Layout, m(Home))
    }
  },
  '/streamer': {
    render: function(vnode) {
      return m(Layout, m(Streamer))
    }
  },
});
