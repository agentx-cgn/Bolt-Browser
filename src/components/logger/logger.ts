
import m from "mithril";

import './logger.scss';

// import { H }        from '../view/services/helper';

import Factory from '../factory';
import { Bolt } from '../../devices/bolt/bolt';
import { IAction, IEvent, ISensorData } from "../../devices/bolt/interfaces";

const log = [] as ILogline[];

function time(timestamp: number) {
  return (new Date(timestamp)).toISOString().slice(-12, -1)
}

function reduceSensorDate(data: ISensorData): string {
  const loc = data.locator;
  if(!loc){
    // debugger;
    return JSON.stringify(data as any);
  }
  return JSON.stringify({
    x:  loc.positionX.toPrecision(3),
    y:  loc.positionY.toPrecision(3),
    vx: loc.velocityX.toPrecision(3),
    vy: loc.velocityY.toPrecision(3),
  })
  .replace(/"/g, '')
  .replace(/\{/g, '')
  .replace(/\}/g, '')
  .replace(/\,/g, ', ')
  .slice(0, 70)

}

const formatter = {
  'action': function ({timestamp, bolt, type, subtype, data}: ILogline) {
    const className = [bolt.name, type, subtype].join(' ');
    return m('tr', {  className }, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',    'Action'), m('td.subtype', subtype),
      m('td.id',      data.id),
      m('td.device',  data.device),
      m('td.command', data.command),
      m('td.target',  data.target || ' '),
      m('td.payload', data.payload.join(' ')),
    ]);
  },
  'event':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    const className = [bolt.name, type, subtype].join(' ');
    return m('tr', { className }, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',    'Event'), m('td.subtype', subtype),
      m('td.id',      data.msg?.id        || ' '),
      m('td.device',  data.msg?.device    || ' '),
      m('td.command', data.msg?.command   || ' '),
      m('td.target',  data.msg?.target    || ' '),
      m('td.payload', data.msg?.payload.join(' ')),
    ]);
  },
  'key':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    const className = [bolt.name, type, subtype].join(' ');
    return m('tr', {  className }, [
      m('td.timestamp', time(timestamp)), m('td.bolt', bolt.name),
      m('td.type',   'Key'), m('td.subtype', subtype),
    ]);
  },
  'sensor':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    const className = [bolt.name, type, subtype].join(' ');
    return m('tr', { className }, [
      m('td.timestamp', time(timestamp)),
      m('td.bolt', bolt.name),
      m('td.type',    'Sensor'),
      m('td.sensor',  {colspan: 6}, reduceSensorDate(data.sensordata)),
    ]);
  },
  'info':   function ({timestamp, bolt, type, subtype, data}: ILogline) {
    const className = [bolt.name, type, subtype].join(' ');
    return m('tr', { className }, [
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

  // push : Array.prototype.push.bind(log),
  push : Array.prototype.unshift.bind(log),
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
      m('table', [
        m('thead', m('tr', [
          m('td',     'TS'),
          m('td',     'Bolt'),
          m('td',     'Type'),
          m('td',     'Name'),
          m('td.tr',  'ID'),
          m('td.tr',  'D'),
          m('td.tr',  'C'),
          m('td.tr',  'T'),
          m('td.tr',  'Payload'),
        ])),
        m('tbody', {}, log.slice(0, 500).map( (line: ILogline) => formatter[line.type](line) )),
      ])
    );

  },

});

export { Logger };
