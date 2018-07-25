// tslint:disable-next-line:no-implicit-dependencies
import { expect } from '@loopback/testlab';
import * as Bull from 'bull';
// tslint:disable-next-line:no-implicit-dependencies
import * as juggler from 'loopback-datasource-juggler';

import { BullConnector } from '../src/bull-connector';

describe('Bull Connector', () => {
  it('should set up queue', () => {
    const connector = new BullConnector({
      name: 'bull',
      queues: [{ name: 'queue' }]
    });

    expect.exist(connector.queueForName('queue'));
  });

  it('should define options queue', () => {
    const options: Bull.QueueOptions = {
      limiter: {max: 5, duration: 10000}
    };
    const connector = new BullConnector({
      name: 'bull',
      queues: [
        {
          name: 'queue',
          options,
        },
      ],
    });

    const queue = connector.queueForName('queue') as any;
    expect.exist(queue);
    expect(queue.limiter).to.be.eql(options.limiter);
  });

  describe('Job', () => {
    let ds: juggler.DataSource;
    let UserQueueModel: any;
    let WalletQueueModel: any;

    before(() => {
      ds = new juggler.DataSource({
        connector: BullConnector,
        name: 'bull',
        queues: [{ name: 'UserQueueModel' }, { name: 'WalletQueueModel' }]
      });

      UserQueueModel = ds.createModel('UserQueueModel');
      WalletQueueModel = ds.createModel('WalletQueueModel');
    });

    afterEach(async () => {
      await UserQueueModel.empty();
      await WalletQueueModel.empty();
    });

    describe('UserQueueModel.add()', () => {
      it('add job to queue', async () => {
        const job = await UserQueueModel.add('email', { foo: 'bar' });
        expect(job.name).to.be.equal('email');
        expect(job.queue.name).to.be.equal('UserQueueModel');
        expect.exist(job);
        expect.exist(job.id);
        await job.remove();
      });
    });

    describe('WalletQueueModel.process()', () => {
      it('process job to queue', async () => {
        const job = await WalletQueueModel.add('transaction', {
          foo: 'bar'
        });
        expect.exist(job);
        expect.exist(job.id);

        WalletQueueModel.process('transaction', (j: Bull.Job) => {
          return Promise.resolve();
        });

        const defaultQueue = WalletQueueModel.getQueue('WalletQueueModel');

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
