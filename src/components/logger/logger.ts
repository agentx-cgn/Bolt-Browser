
import m from "mithril";

import './logger.scss';

// import { H }        from '../view/services/helper';

import Factory from '../factory';
import { Bolt } from '../../devices/bolt/bolt';
import { IAction, IEvent } from "../../devices/bolt/interfaces";

const log = [] as ILogline[];

function time(timestamp: number) {
  return (new Date(timestamp)).toISOString().slice(-12, -1)
}

const formatter = {
  // 'message': function ({timestamp, bolt, type, subtype, data}: ILogline) {
  //   return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
  //     m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
  //     m('td.type', type), m('td.subtype', subtype),
  //     m('td.id', data.id),
  //   ]);
  // },
  'action': function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',    'Action'), m('td.subtype', subtype),
      m('td.id',      data.id),
      m('td.device',  data.device),
      m('td.command', data.command),
      m('td.target',  data.target || ' '),
      m('td.data',    data.payload.join(' ')),
    ]);
  },
  'event':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',    'Event'), m('td.subtype', subtype),
      m('td.id',      data.msg?.seqNumber || ' '),
      m('td.device',  data.msg?.deviceId  || ' '),
      m('td.command', data.msg.command    || ' '),
      m('td.target',  data.msg?.targetId  || ' '),
      m('td.data',    data.msg?.packet.join(' ')),
    ]);
  },
  'key':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',   'Event'), m('td.subtype', subtype),
    ]);
  },
  'sensor':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',    'Sensor'), m('td.subtype', subtype),
      m('td.id',      ' '),
      m('td.device',  ' '),
      m('td.command', ' '),
      m('td.target',  ' '),
      m('td.target',  JSON.stringify(data.sensordata).slice(0, 50)),
    ]);
  },
  'info':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    return m('tr.info', {style: {backgroundColor: bolt.config.colors.log}}, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type', 'Info'), m('td.subtype', subtype),
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
    Logger.append(bolt, 'action', action.name, action);
  },
  event: function (bolt: Bolt, eventname: string, event: IEvent) {
    eventname.startsWith('key') ?
      Logger.append(bolt, 'key', eventname) :
    event.sensordata            ?
      Logger.append(bolt, 'sensor', eventname , event) :
      Logger.append(bolt, 'event',  eventname , event)
    ;
  },


  view( vnode: any ) {

    const style = {height: '512px', overflowY: 'scroll'};

    return m('div.logger', { style },
      m('table', {}, [
        m('thead', {}, m('tr', {}, [
          m('td', 'TS'),
          m('td', 'Bolt'),
          m('td', 'Type'),
          m('td', 'Name'),
          m('td', 'ID'),
          m('td', 'Dev'),
          m('td', 'Cmd'),
          m('td', 'Tgt'),
          m('td', 'DATA'),
        ])),
        m('tbody', {}, log.slice(-500).map( (line: ILogline) => {
          return formatter[line.type](line);
        })),
      ])
    );

  },

});

export { Logger };
