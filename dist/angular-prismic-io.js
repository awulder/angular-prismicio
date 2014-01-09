/**
 * Component for using AngularJS with prismic.io
 * @version v0.1.0 - 2014-01-10
 * @link 
 * @author Arjan Wulder <arjanwulder@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
/* global _ */

'use strict';

(function() {

  var module = angular.module('prismic.io', []);

  module.provider('Prismic', function() {
    var Configurer = {};
    Configurer.init = function(object, config) {
      object.configuration = config;

      config.apiEndpoint = _.isUndefined(config.apiEndpoint) ? '' : config.apiEndpoint;
      object.setApiEndpoint = function(apiEndpoint) {
        config.apiEndpoint = apiEndpoint;
      };

      config.accessToken = _.isUndefined(config.accessToken) ? '' : config.accessToken;
      object.setAccessToken = function(accessToken) {
        config.accessToken = accessToken;
      };

      config.clientId = _.isUndefined(config.clientId) ? '' : config.clientId;
      object.setClientId = function(clientId) {
        config.clientId = clientId;
      };

      config.clientSecret = _.isUndefined(config.clientSecret) ? '' : config.clientSecret;
      object.setClientSecret = function(clientSecret) {
        config.clientSecret = clientSecret;
      };

      config.linkResolver = _.isUndefined(config.linkResolver) ? angular.noop : config.linkResolver;
      object.setLinkResolver = function(linkResolver) {
        config.linkResolver = linkResolver;
      };
    };

    var globalConfiguration = {};

    Configurer.init(this, globalConfiguration);

    this.$get = ['$window', '$http', '$q', function($window, $http, $q) {

      function createService(config) {
        var service = {};
        var prismic = $window.Prismic;

        function requestHandler(url, callback) {
          $http.get(url).then(function(response) {
            callback(response.data);
          });
        }

        function getApiHome(callback) {
          prismic.Api(config.apiEndpoint, callback, config.accessToken, requestHandler);
        }

        function buildContext(ref, callback) {
          getApiHome(function(api) {
            var ctx = {
              ref: (ref || api.data.master.ref),
              api: api,
              maybeRef: (ref && ref !== api.data.master.ref ? ref : ''),
              maybeRefParam: (ref && ref !== api.data.master.ref ? '&ref=' + ref : ''),
              oauth: function() {
                return {
                  accessToken: config.accessToken,
                  hasPrivilegedAccess: !!config.accessToken
                };
              },
              linkResolver: config.linkResolver
            };
            callback(ctx);
          });
        }

        function withPrismic(callback) {
          buildContext(queryString['ref'], function(ctx) {
            callback.call($window, ctx);
          });
        }

        function parseQS(query) {
          var params = {},
            match,
            pl = /\+/g,
            search = /([^&=]+)=?([^&]*)/g,
            decode = function(s) {
              return decodeURIComponent(s.replace(pl, " "));
            };

          while (match = search.exec(query)) {
            params[decode(match[1])] = decode(match[2]);
          }
          return params;
        }

        var queryString = parseQS($window.location.search.substring(1));
//        var encodedHash = parseQS($window.location.hash.substring(1));

        function all() {
          var deferred = $q.defer();
          withPrismic(function(ctx) {
            ctx.api.form('everything').ref(ctx.ref).submit(function(docs) {
              deferred.resolve(docs);
            });
          });
          return deferred.promise;
        }

        function query(predicate) {
          var deferred = $q.defer();
          withPrismic(function(ctx) {
            ctx.api.forms('everything').ref(ctx.ref).query(predicate).submit(function(docs) {
              deferred.resolve(docs);
            });
          });
          return deferred.promise;
        }

        function document(id) {
          var deferred = $q.defer();
          withPrismic(function(ctx) {
            ctx.api.forms('everything').ref(ctx.ref).query('[[:d = at(document.id, "' + id + '")]]').submit(function(docs) {
              deferred.resolve(_.first(docs));
            });
          });
          return deferred.promise;
        }

        function documents(ids) {
          var deferred = $q.defer();
          if (ids && ids.length) {
            withPrismic(function(ctx) {
              ctx.api.forms('everything').ref(ctx.ref).query('[[:d = any(document.id, [' + _(ids).map(function(id) {
                  return '"' + id + '"';
                }).join(',') + '])]]').submit(function(docs) {
                deferred.resolve(docs);
              });
            });
          }
          return deferred.promise;
        }

        function bookmarked(bookmark) {
          var deferred = $q.defer();
          withPrismic(function(ctx) {
            ctx.api.bookmarks[bookmark].submit(function(docs) {
              deferred.resolve(_.first(docs));
            });
          });

          var promise = deferred.promise;
          promise.then(function(id) {
            return document(id);
          });
        }

        Configurer.init(service, config);
        service.all = _.bind(all, service);
        service.query = _.bind(query, service);
        service.document = _.bind(document, service);
        service.documents = _.bind(documents, service);
        service.bookmark = _.bind(bookmarked, service);
        return service;
      }

      return createService(globalConfiguration);
    }];
  });
})();