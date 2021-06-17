import * as Bull from 'bullmq';
// tslint:disable-next-line:no-submodule-imports
import { Queue3 } from 'bullmq/dist/classes/compat';
import { BullConnector } from './bull-connector';

function add(this: typeof DataAccessObject, data: object, jobOptions?: any): Promise<Bull.Job>;
function add(this: typeof DataAccessObject, name: string, data: object, jobOptions?: any): Promise<Bull.Job>;
function add(this: typeof DataAccessObject, nameOrData: any, dataOrOptions?: any, jobOptions?: any): Promise<Bull.Job> {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Queue3;
  return queue.add(nameOrData, dataOrOptions, jobOptions);
};

function process(this: typeof DataAccessObject, callback: ((job: Bull.Job, done: any) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
function process(this: typeof DataAccessObject, concurrency: number, callback: ((job: Bull.Job, done: any) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
// tslint:disable-next-line:unified-signatures
function process(this: typeof DataAccessObject, name: string, callback: ((job: Bull.Job, done: any) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
function process(this: typeof DataAccessObject, name: string, concurrency: number, callback: ((job: Bull.Job, done: any) => void) | ((job: Bull.Job) => Promise<any>) | string): void;
function process(this: typeof DataAccessObject, firstArg: any): void {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Queue3;

  switch (arguments.length) {
    case 1:
      queue.process(firstArg);
      break;
  }
}

function getQueue(this: typeof DataAccessObject): Queue3 | undefined {
  const connector = this.getConnector();

  return connector.queueForName(this.modelName);
};

function empty(this: typeof DataAccessObject): Promise<void> {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Queue3;
  return queue.empty() as Promise<void>;
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
