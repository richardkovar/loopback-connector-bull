// tslint:disable-next-line:no-implicit-dependencies
import { expect } from '@loopback/testlab';
import * as Bull from 'bull';
// tslint:disable-next-line:no-implicit-dependencies
import * as redis from 'ioredis';
import * as juggler from 'loopback-datasource-juggler';

import { BullConnector, BullQueue } from '../src';

describe('Bull', () => {
  let client;

  beforeEach(() => {
    client = new redis();
    return client.flushdb();
  });

  it('should set up queue', () => {
    const connector = new BullConnector({
      name: 'bull',
      queues: [{ name: 'queue' }]
    });

    expect.exist(connector.queueForName('queue'));
  });

  it('should connect to custom url', () => {
    const connector = new BullConnector({
      name: 'bull',
      queues: [
        {
          name: 'queue',
          options: { limiter: 5 },
          url: 'redis://localhost:6379'
        }
      ]
    });
  });

  describe('Job', () => {
    let QueueModel: any;

    beforeEach(() => {
      const ds = new juggler.DataSource({
        connector: BullConnector,
        name: 'bull',
        queues: [{ name: 'default-queue' }, { name: 'specific-queue' }]
      });

      QueueModel = ds.createModel('QueueModel');
    });

    describe('QueueModel.add()', () => {
      it('add job to queue', async () => {
        const job = await QueueModel.add('specific-queue', { foo: 'bar' });
        expect(job.queue.name).to.be.equal('specific-queue');
        expect.exist(job);
        expect.exist(job.id);
        return job.remove();
      });
    });

    describe('QueueModel.process()', () => {
      it('process job to queue', async () => {
        const job = await QueueModel.add('default-queue', {
          foo: 'bar'
        });
        expect.exist(job);
        expect.exist(job.id);

        QueueModel.process('default-queue', (j: Bull.Job) => {
          return Promise.resolve();
        });

        const defaultQueue = QueueModel.get('default-queue');

        return new Promise((resolve, reject) => {
          defaultQueue.on('completed', (j: Bull.Job) => {
            j.remove()
              .then(() => resolve())
              .catch(reject);
          });
        });
      });
    });
  });
});
