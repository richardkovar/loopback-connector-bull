import * as assert from 'assert';
import * as Promise from 'bluebird';
import * as Bull from 'bull';

export class BullQueue {
  public static dataSource: any;

  public static add(
    queueName: string,
    data: any,
    options?: { name?: string; jobOptions?: Bull.JobOptions }
  ): Promise<Bull.Job> {
    const dataSource = this.dataSource;
    const connector = dataSource.connector;

    assert(typeof queueName === 'string', 'queueName is required');
    assert(typeof data === 'object', 'data is required');
    assert(connector, 'Cannot add job without a connector!');

    const queue = connector.queueForName(queueName);

    if (!queue) {
      const err = new Error(`Queue with name ${queueName} not found`);
      throw err;
    }

    options = options || {};
    const name = options.name;
    const jobOptions = options.jobOptions;

    if (name) {
      return queue.add(name, data, jobOptions);
    } else {
      return queue.add(data, jobOptions);
    }
  }
  public static process(
    queueName: string,
    processor: ((job: any, done?: any) => Promise<any>) | string,
    options?: { name?: string; concurrency?: number }
  ): void {
    const dataSource = this.dataSource;
    const connector = dataSource.connector;

    assert(typeof queueName === 'string', 'queueName is required');
    assert(connector, 'Cannot add job without a connector!');

    const queue = connector.queueForName(queueName);

    if (!queue) {
      const err = new Error(`Queue with name ${queueName} not found`);
      throw err;
    }

    options = options || {};
    const name = options.name;
    const concurrency = options.concurrency || 1;

    if (name) {
      return queue.process(name, concurrency, processor);
    } else {
      return queue.process(concurrency, processor);
    }
  }

  public static get(queueName: string): Bull.Queue {
    const dataSource = this.dataSource;
    const connector = dataSource.connector;

    assert(typeof queueName === 'string', 'queueName is required');
    assert(connector, 'Cannot add job without a connector!');

    const queue = connector.queueForName(queueName);

    if (!queue) {
      const err = new Error(`Queue with name ${queueName} not found`);
      throw err;
    }

    return queue;
  }
}
