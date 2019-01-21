import * as Promise from 'bluebird';
import * as Bull from 'bull';
import { BullConnector } from './bull-connector';

function add(this: typeof DataAccessObject, data: object, jobOptions?: Bull.JobOptions): Promise<Bull.Job>;
function add(this: typeof DataAccessObject, name: string, data: object, jobOptions?: Bull.JobOptions): Promise<Bull.Job>;
function add(this: typeof DataAccessObject, nameOrData: any, dataOrOptions?: any, jobOptions?: any): Promise<Bull.Job> {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Bull.Queue;
  return queue.add(nameOrData, dataOrOptions, jobOptions);
};

function process(this: typeof DataAccessObject, callback: ((job: Bull.Job, done: Bull.DoneCallback) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
function process(this: typeof DataAccessObject, concurrency: number, callback: ((job: Bull.Job, done: Bull.DoneCallback) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
// tslint:disable-next-line:unified-signatures
function process(this: typeof DataAccessObject, name: string, callback: ((job: Bull.Job, done: Bull.DoneCallback) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
function process(this: typeof DataAccessObject, name: string, concurrency: number, callback: ((job: Bull.Job, done: Bull.DoneCallback) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
function process(this: typeof DataAccessObject, firstArg: any, secondArg?: any, thirdArg?: any): void {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Bull.Queue;

  switch (arguments.length) {
    case 1:
      queue.process(firstArg);
      break;
    case 2:
      queue.process(firstArg, secondArg);
      break;
    default:
      queue.process(firstArg, secondArg, thirdArg);
  }
}

function getQueue(this: typeof DataAccessObject): Bull.Queue | undefined {
  const connector = this.getConnector();

  return connector.queueForName(this.modelName);
};

function empty(this: typeof DataAccessObject): Promise<void> {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Bull.Queue;
  return queue.empty();
};

const getConnector = function(this: typeof DataAccessObject): BullConnector {
  return this.getDataSource().connector;
};

export const DataAccessObject: {
  getConnector: () => BullConnector,
  [property: string]: any;
} = {
  add,
  empty,
  getConnector,
  getQueue,
  process,
};
