import m from "mithril";

import 'tachyons/css/tachyons.min.css';
import './index.scss';

import { HomeComponent } from './view/home.component';

m.route(document.body, "/", {
  "/": HomeComponent
})
