import m from "mithril";

import { HomeComponent } from './view/home.component';

m.route(document.body, "/", {
  "/": HomeComponent
})
