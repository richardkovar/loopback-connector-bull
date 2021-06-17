import * as Bluebird from 'bluebird';
import * as Bull from 'bullmq';
// tslint:disable-next-line:no-submodule-imports
import { Queue3 } from 'bullmq/dist/classes/compat';
// tslint:disable-next-line:no-implicit-dependencies
import * as Redis from 'ioredis';
// import { Connector } from 'loopback-connector';
// tslint:disable-next-line:no-var-requires
const Connector = require('loopback-connector');
import { parse as urlParse } from 'url';
import { DataAccessObject } from './data-access-object';

function redisUrlParse(url: string) {
  const redisConfig = urlParse(url);
  return {
    database: (redisConfig.pathname || '/0').substr(1) || '0',
    host: redisConfig.hostname || 'localhost',
    password: (redisConfig.auth && redisConfig.auth.split(':')[1]) || undefined,
    port: Number(redisConfig.port) || 6379
  };
}

export class BullConnector extends Connector {
  public name: string;
  private queues: any = {};
  private queuesIndex: string[] = [];

  constructor(settings: Options) {
    super(settings);

    this.name = settings.name;
    this.setupQueue(settings);
  }

  public queueForName(name: string): Queue3 | undefined {
    return this.queues[name];
  }

  public setupQueue(settings: Options): void {
    const redisUrl = redisUrlParse(settings.url || '');
    let clientRedis: Redis.Redis;
    let subscriberRedis: Redis.Redis;
    let createClient: any;

    if (settings.sharedConnection !== false) {
      clientRedis = new Redis(redisUrl);
      subscriberRedis = new Redis(redisUrl);
      createClient = (type: string) => {
        switch (type) {
          case 'client':
            return clientRedis;
          case 'subscriber':
            return subscriberRedis;
          default:
            return new Redis(redisUrl);
        }
      };
    }

    const queues = settings.queues;

    for (const queue of queues) {
      const name = queue.name;
      const options = queue.options || {};

      const queueOptions: any = {
        ...options,
        ...{ redis: redisUrl }
      };

      if (settings.sharedConnection !== false) {
        queueOptions.createClient = createClient;
      }

      this.queues[name] = new Queue3(name, queueOptions);
      this.queuesIndex.push(name);
    }
  }

  get DataAccessObject() {
    return DataAccessObject;
  }

  public connect(): void {
    return;
  }

  public disconnect(cb: any): any {
    if (this.queuesIndex.length > 0) {
      Bluebird.map(this.queuesIndex, (queueName: string) => {
        const queue = this.queues[queueName] as Bull.Queue;
        // tslint:disable-next-line:no-shadowed-variable
        return new Promise<void>(resolve => {
          queue.on('completed', () => {
            queue
              .close()
              .then(() => resolve())
              .catch(() => resolve());
          });
        });
      })
        .then(cb)
        .catch(cb);
    } else if (cb) {
      process.nextTick(cb);
    }
  }

  public ping(): void {
    return;
  }
}

export type Options = IAnyObject<any>;

export interface IAnyObject<T = any> {
  [property: string]: T;
}
