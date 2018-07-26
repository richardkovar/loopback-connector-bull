import * as assert from 'assert';
import * as Promise from 'bluebird';
import * as Bull from 'bull';

// @ts-ignore
export const DataAccessObject: any = {};

DataAccessObject.add = function(
  name: string,
  data: any,
  jobOptions?: Bull.JobOptions
): Promise<Bull.Job> {
  const connector = this.getConnector();

  assert(typeof data === 'object', 'data is required');

  const queue = connector.queueForName(this.modelName);

  if (name) {
    return queue.add(name, data, jobOptions);
  } else {
    return queue.add(data, jobOptions);
  }
};

DataAccessObject.process = function(...args: any[]): Promise<any> | void {
  const connector = this.getConnector();

  const queue: Bull.Queue = connector.queueForName(this.modelName);

  if (args.length === 1) {
    return queue.process(args[0]);
  } else if (args.length === 2) {
    const nameOrConcurrency = args[0];
    const processor = args[1];
    queue.process(nameOrConcurrency, processor);
  } else {
    const name = args[0];
    const concurrency = args[1];
    const processor = args[2];
    return queue.process(name, concurrency, processor);
  }
};

DataAccessObject.getQueue = function(): Bull.Queue | undefined {
  const connector = this.getConnector();

  return connector.queueForName(this.modelName);
};

DataAccessObject.empty = function(): Promise<void> {
  const connector = this.getConnector();

  const queue = connector.queueForName(this.modelName) as Bull.Queue;
  return queue.empty();
};

DataAccessObject.getConnector = function() {
  return this.getDataSource().connector;
};
