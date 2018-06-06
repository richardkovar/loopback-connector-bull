import * as Bull from 'bull';
import * as juggler from 'loopback-datasource-juggler';
import { parse as urlParse } from 'url';
import { BullQueue } from './bull-queue';

function redisUrlParse(url: string) {
  const redisConfig = urlParse(url);
  return {
    database: (redisConfig.pathname || '/0').substr(1) || '0',
    host: redisConfig.hostname || 'localhost',
    password: (redisConfig.auth && redisConfig.auth.split(':')[1]) || undefined,
    port: Number(redisConfig.port || 6379)
  };
}

export class BullConnector {
  public static initialize(dataSource: juggler.DataSource, cb: () => void) {
    dataSource.connector = new BullConnector(dataSource.settings);
    cb();
  }

  public name: string;

  private queuesIndex: any = {};

  constructor(settings: any) {
    this.name = settings.name;
    const queues = settings.queues;

    queues.forEach(this.setupQueue.bind(this));
  }

  public queueForName(name: string): Bull.Queue {
    return this.queuesIndex[name];
  }

  public setupQueue(setting: any): void {
    this.queuesIndex = this.queuesIndex || {};

    const name = setting.name;
    const url = setting.url;
    let queueOptions = setting.options || {};
    const redis = url ? redisUrlParse(url) : {};
    queueOptions = { redis, ...queueOptions };

    const queue = new Bull(name, queueOptions);

    this.queuesIndex[name] = queue;
  }

  get DataAccessObject() {
    return {
      add: BullQueue.add.bind(this),
      get: BullQueue.get.bind(this),
      process: BullQueue.process.bind(this)
    };
  }

  public connect(): void {
    return;
  }

  public disconnect(): void {
    return;
  }

  public ping(): void {
    return;
  }
}
