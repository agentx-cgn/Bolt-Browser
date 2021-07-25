
import { ConfigPages }  from '../../data/config-pages';
import Factory          from '../../components/factory';
import Config           from '../../data/config';
import { $$ }           from '../../services/helper';
import Caissa           from '../../caissa';
import Backdrop         from '../backdrop';

const Navigation = Factory.create('Navigation', {

    view( {attrs: {route}} ) {

        const navi     = ConfigPages[route].navi;
        const clicker  = (route, params) => {
            return (e) => {
                e.redraw = false;
                Backdrop.hide();
                $$('#toggle-mobile-menu').checked = false;
                Caissa.route(route, params);
                // return H.eat(e);
            };
        };

        const onmenu = (e) => {
            e.redraw = false;
            Caissa.route('/menu/');
        };

        return m('nav', [

            // hamburger
            // m('label', {for:'toggle-mobile-menu', 'aria-label':'Menu'},
            m('label', {'aria-label':'Menu', onclick: onmenu},
                m('i.hamburger.fa.fa-bars '),
                m('span.home.f4.fiom.white.pl3', 'Caissa'),
            ),

            // toggle, needs id for label
            m('input[type=checkbox]', {id: 'toggle-mobile-menu', oninput: (e) => {
                e.redraw = false;
                e.target.checked && Backdrop.show( () => {
                    $$('#toggle-mobile-menu').checked = false;
                });
            }}),

            m('ul', Array.from(Config.menu).map( ([route, entry, params]) => {
                return m('li', {
                    onclick: clicker(route, params),
                    class: route.startsWith(navi) ? 'selected' : 'unselected'}, entry)
                ;
            })),
                // m('li.unselected', m('a.link', {target:'_blank', href: 'https://github.com/agentx-cgn/caissa'}, 'SOURCE')),
                // m('li.unselected', m('a.link', {target:'_blank', href: 'https://caissa.js.org/'}, 'LIVE')),

            // ]),

        ]);
    },
});

export default Navigation;
