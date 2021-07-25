import m from "mithril";

import 'tachyons/css/tachyons.min.css';
import './index.scss';

// import { HomeComponent } from './view/home.component';
import { LayoutComponent } from './view/layout';

import './assets/aruco/cv.js';
import './assets/aruco/aruco.js';

m.route(document.body, "/", {
  "/": LayoutComponent
})
