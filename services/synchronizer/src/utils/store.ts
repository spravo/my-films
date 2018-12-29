import path from 'path';
import fs from 'fs';
import createNamespaceDebug from 'debug';

const debug = createNamespaceDebug('app:store');

export interface IStore {
  saveEntity(data: Object): Promise<void>;
}

export class StoreFS implements IStore {
  private stream: fs.WriteStream;
  private readonly timer: NodeJS.Timeout;
  private buffer: any[] = [];

  constructor (options: { path?: string, flashTime?: number } = {}) {
    const path2file = path.join(options.path || '.', 'tmp.json');
    const time = (options.flashTime || 30) * 1000;

    this.stream = fs.createWriteStream(path2file, { flags: 'w+', encoding: 'utf8' });
    this.timer = setInterval(this.handlerTimer, time);
    debug('init', { path: path2file, time });

    this.stream.write('[');
  }

  private handlerTimer = () => {
    if (!this.buffer.length) {
      debug('nothing to save, buffer is empty');
      return;
    }

    debug('saving, buffer size', this.buffer.length);
    // TODO: remove comma if this is last batch
    const data = this.buffer.map(data => JSON.stringify(data)).join(',') + ',';
    this.buffer = [];
    this.stream.write(data);
  };

  public async saveEntity (data: Object): Promise<void> {
    this.buffer.push(data);
  }

  public destroy () {
    this.stream.write(']');

    this.stream.close();
    clearInterval(this.timer);
  }
}
