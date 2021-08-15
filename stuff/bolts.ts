
// import './layout.scss';
import m from "mithril";

// // import { H }        from '../view/services/helper';
// import { Nothing }  from './components/misc';
import Factory      from '../src/components/factory';

export const Panel = Factory.create('Panel', {

  view( vnode: any ) {

    let bgcol, { title, width } = vnode.attrs;

    vnode.state.toggled = vnode.state.toggled === undefined ? false : vnode.state.toggled

    width = vnode.state.toggled ? "24px"   : width;
    title = vnode.state.toggled ? "O"      : title;
    bgcol = vnode.state.toggled ? "bg-333" : 'bg-999';

    function toggle () { vnode.state.toggled = !vnode.state.toggled; }

    return m('div.panel', { style: { width, overflowX: 'hidden' } }, [
      m('div.pa1.ceee.sans-serif.pointer.' + bgcol,
        { style: { }, onclick: toggle  },
        title
      ),
      ...vnode.children
    ]);

  }

});
