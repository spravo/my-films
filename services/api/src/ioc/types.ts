const TYPES = {
  DatabaseConnector: Symbol.for('DatabaseConnector'),
  AppConfig: Symbol.for('AppConfig'),
  PassportService: Symbol.for('PassportService'),
  PassportGoogleService: Symbol.for('PassportGoogleService'),

  // actions
  SaveMovieAction: Symbol.for('SaveMovieAction'),
};

export default TYPES;
