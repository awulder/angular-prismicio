// Karma configuration

module.exports = function(config) {
  config.set({
    basePath: '',
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'prismic.js',
      '*Spec.js'
    ],

    port: 8080,
    colort: true,

    logLevel: config.LOG_INFO,

    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],

    autoWatch: true,
    singleRun: false
  });
};