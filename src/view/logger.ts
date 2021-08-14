
import m from "mithril";

import './logger.scss';

// import { H }        from '../view/services/helper';

import Factory from '../components/factory';
import { Bolt } from './../devices/bolt/bolt';
import { IAction, IEvent } from "./../devices/bolt/interfaces";

function sortQueue (a: IAction, b: IAction) {
  return b.timestamp - a.timestamp;
}

const log = [] as ILogline[];

function time(timestamp: number) {
  return (new Date(timestamp)).toISOString().slice(-12, -1)
}

const formatter = {
  'sensor':  function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type', type), m('td.subtype', subtype),
      m('td.id', data.id),
    ]);
  },
  'message': function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type', type), m('td.subtype', subtype),
      m('td.id', data.id),
    ]);
  },
  'action': function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type', type), m('td.subtype', subtype),
      m('td.id', data.id),
    ]);
  },
  'event':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type', type), m('td.subtype', subtype),
      m('td.id', ' '),
    ]);
  },
  'info':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type', type), m('td.subtype', subtype),
      m('td.id', ' '),
    ]);
  },
} as { [key: string]: any; }

export interface ILogline {
  timestamp: number,
  bolt: Bolt,
  type: string,
  subtype: string,
  data: any,
};

// TIMESTAMP, BOLT, WHAT, NAME, ID, EXE, ACK, DATA | POSX, POSY, VELX, VELY

const Logger = Factory.create('Logger', {

  push : Array.prototype.push.bind(log),
  sort : function(column='timsstamp') {
    log.sort( (a:any, b: any) => a[column] - b[column]);
  },
  append : function (bolt: Bolt, type: string, subtype: string, data?: any) {
    Logger.push({ timestamp: Date.now(), bolt: bolt, type, subtype, data } as ILogline);
  },

  info: function (bolt: Bolt, info: string) {
    Logger.append(bolt, 'info', info );
  },
  action: function (bolt: Bolt, action: IAction) {
    Logger.append(bolt, 'action', action.name, action, );
  },
  event: function (bolt: Bolt, eventname: string, event: IEvent) {
    Logger.append(bolt, 'event', eventname , event);
  },


  view( vnode: any ) {
    return m('div.logger', {},
      m('table', {}, [
        m('thead', {}, m('tr', {}, [
          m('td', 'TS'),
          m('td', 'Bolt'),
          m('td', 'Type'),
          m('td', 'Name'),
          m('td', 'ID'),
          m('td', 'X'),
          m('td', 'A'),
          m('td', 'DATA'),
        ])),
        m('tbody', {}, log.slice(-10).map( (line: ILogline) => {
          return formatter[line.type](line);
        })),
      ])
    );

  },
  // viewX( vnode: any ) {

  //   const bolt: Bolt = vnode.attrs.bolt;
  //   const style = { background: bolt.config.colors.backcolor + '88', height: '60px', overflowY: 'scroll' };

  //   return m('div.logger.w-100.code.f7.pa1.pl3', { style }, bolt.queue.sort(sortQueue).map( (cmd: IAction) => {
  //     return m('div', [
  //       m('span.ph1', cmd.bolt.name),
  //       m('span.ph1', cmd.id),
  //       m('span.ph1', cmd.executed     ? 'I' : 'O'),
  //       m('span.ph1', cmd.acknowledged ? 'I' : 'O'),
  //       m('span.ph1', cmd.name),
  //       m('span.ph1', cmd.command.join(' ')),
  //     ]);
  //   }));

  // }

});

export { Logger };
