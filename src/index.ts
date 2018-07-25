import { BullConnector } from './bull-connector';

export function initialize(dataSource: any, cb: () => void) {
  const connector = new BullConnector(dataSource.settings);
  dataSource.connector = connector;
  dataSource.connector.dataSource = dataSource;
  cb();
}
