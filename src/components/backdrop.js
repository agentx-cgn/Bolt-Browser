
import Factory   from './factory';
import { $$ }    from '../services/helper';

let callback = null;

const Backdrop = Factory.create('Backdrop', {

    show (cb) {
        $$('back-drop').classList.add('visible');
        callback = cb || null;
    },
    hide () {
        $$('back-drop').classList.remove('visible');
    },
    view () {
        return m('back-drop', { onclick: (e) => {
            e.redraw = false;
            Backdrop.hide();
            callback && callback();
        }});
    },

});

export { Backdrop };
