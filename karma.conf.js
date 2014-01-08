// Karma configuration

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'http://code.angularjs.org/1.2.7/angular.js',
      'http://code.angularjs.org/1.2.7/angular-mocks.js',
      'src/prismic.js',
      'test/*.js'
    ],
    reporters: ['progress'],
    port: 9876,
    runnerPort: 9100,
    color: true,
    logLevel: config.LOG_INFO,
    browsers: ['PhantomJS'],
    autoWatch: true,
    singleRun: false
  });
};