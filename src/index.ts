import m from "mithril";

import 'tachyons/css/tachyons.min.css';
import './index.scss';

import { LayoutComponent } from './view/layout';

// import './services/aruco/cv.js';
// import './services/aruco/aruco.js';

m.route(document.body, "/", {
  "/": LayoutComponent
})
