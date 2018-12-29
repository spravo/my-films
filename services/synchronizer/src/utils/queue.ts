import EventEmitter from 'events'

import _ from 'lodash';
import async from 'async';

export interface IJobQueue<T = any> {
  readonly payload: T;
  readonly id: string;
  retry: number;
  errors: Error[];
}

export interface IJobHandlerMeta {
  remaining: number;
  reset: number;
}
export type IJobHandler<T = any> = (payload: T) => Promise<{ data: any, meta: IJobHandlerMeta }>;

enum IStatus {
  run = 'run',
  pause = 'pause',
  // wait = 'wait',
}

export interface IQueue<T> {
  addJob(payload: T): void;
  start(): boolean;

  readonly emitter: EventEmitter;
}

export default class Queue<T = any> implements IQueue<T> {
  private errorJobs: IJobQueue<T>[] = [];
  private jobs: IJobQueue<T>[] = [];
  private status: IStatus = IStatus.pause;
  private readonly jobHandler: IJobHandler<T>;
  private readonly concurrency: number;
  private prevJobMeta?: IJobHandlerMeta;

  public readonly emitterDescriptor = {
    jobError: 'job:error',
    jobWait: 'job:wait',
    jobRun: 'job:run',
    jobSuccess: 'job:success',

    queueEnd: 'queue:end',
    queueStart: 'queue:start',
  };

  public readonly emitter = new EventEmitter();

  private handlerErrorIterator (job: IJobQueue<T>, error: any) {
    if (job.retry < 3) {
      this.jobs.unshift({ ... job, errors: [ ...job.errors, error ], retry: job.retry + 1 });
    } else {
      this.emitter.emit(this.emitterDescriptor.jobError, job);
      this.errorJobs.push(job);
    }
  }

  private handlerIterator = async (job: IJobQueue<T>, done: Function): Promise<void> => {
    const { emitterDescriptor } = this;
    try {
      if (this.prevJobMeta && this.prevJobMeta.remaining < this.concurrency) {
        const time = this.prevJobMeta.reset - Date.now() + 500;
        this.emitter.emit(emitterDescriptor.jobWait, job.id, time);
        await this.wait(time);
      }
      this.emitter.emit(emitterDescriptor.jobRun, job.id);

      const data = await this.jobHandler(job.payload);
      if (this.shouldUpdatePrevMeta(data.meta)) {
        this.prevJobMeta = data.meta;
      }
      this.emitter.emit(emitterDescriptor.jobSuccess, job.id, data);
    } catch (e) {
      this.handlerErrorIterator(job, e);
    } finally {
      done();
    }
  };

  private handlerQueueEnd = () => {
    this.emitter.emit(this.emitterDescriptor.queueEnd, this.errorJobs);
  };

  private wait (time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  private shouldUpdatePrevMeta (meta: IJobHandlerMeta): boolean {
    if (!this.prevJobMeta) {
      return true;
    }

    if (meta.reset === this.prevJobMeta.reset && meta.remaining < this.prevJobMeta.remaining) {
      return true;
    }
    return meta.reset > this.prevJobMeta.reset;
  }

  constructor (options: { concurrency?: number, jobHandler: IJobHandler<T> }) {
    this.concurrency = options.concurrency || 5;
    this.jobHandler = options.jobHandler;
  }

  public addJob (payload: T) {
    this.jobs.push({
      payload,
      id: _.uniqueId('jobQueue'),
      retry: 0,
      errors: [],
    });
  }

  public start (): boolean {
    if (this.status !== IStatus.pause) {
      return false;
    }
    if (!this.jobs.length) {
      return false;
    }

    this.emitter.emit(this.emitterDescriptor.queueStart, { length: this.jobs.length });
    this.status = IStatus.run;
    async.forEachLimit<IJobQueue<T>, Error>(this.jobs, this.concurrency, this.handlerIterator, this.handlerQueueEnd);
    return true;
  }
}
