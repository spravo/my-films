export default interface ILoggerService {
  debug(...args: any[]): void;
  createNamespaceDebug(name:string): (...args: any[]) => void;
  error(...args: any[]): void;
  info(...args: any[]): void;
}
