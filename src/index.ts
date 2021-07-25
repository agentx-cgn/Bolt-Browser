import m from "mithril";

import 'tachyons/css/tachyons.min.css';
import './index.scss';

// import { HomeComponent } from './view/home.component';
import { LayoutComponent } from './view/layout';

m.route(document.body, "/", {
  "/": LayoutComponent
})
