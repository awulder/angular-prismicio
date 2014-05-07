/* global */

'use strict';

angular.module('prismic.io', [])
  .provider('Prismic', function() {
    var Configurer = {};
    Configurer.init = function(object, config) {
      object.configuration = config;

      config.apiEndpoint = angular.isUndefined(config.apiEndpoint) ? '' : config.apiEndpoint;
      object.setApiEndpoint = function(apiEndpoint) {
        config.apiEndpoint = apiEndpoint;
      };

      config.accessToken = angular.isUndefined(config.accessToken) ? '' : config.accessToken;
      object.setAccessToken = function(accessToken) {
        config.accessToken = accessToken;
      };

      config.clientId = angular.isUndefined(config.clientId) ? '' : config.clientId;
      object.setClientId = function(clientId) {
        config.clientId = clientId;
      };

      config.clientSecret = angular.isUndefined(config.clientSecret) ? '' : config.clientSecret;
      object.setClientSecret = function(clientSecret) {
        config.clientSecret = clientSecret;
      };

      config.linkResolver = angular.isUndefined(config.linkResolver) ? angular.noop : config.linkResolver;
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
          $http.get(url).then(
            function(response) {
              callback(null, response.data);
            },
            function(error) {
              callback(error, null);
            });
        }

        function getApiHome(callback) {
          prismic.Api(config.apiEndpoint, callback, config.accessToken, requestHandler);
        }

        function buildContext(ref, callback) {
          getApiHome(function(error, api) {
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
            callback(ctx);
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
            ctx.api.form('everything').ref(ctx.ref).submit(function(error, docs) {
              deferred.resolve(docs);
            });
          });
          return deferred.promise;
        }

        function query(predicateBasedQuery) {
          var deferred = $q.defer();
          withPrismic(function(ctx) {
            ctx.api.forms('everything').ref(ctx.ref).query(predicateBasedQuery).submit(function(error, docs) {
              deferred.resolve(docs);
            });
          });
          return deferred.promise;
        }

        function document(id) {
          var deferred = $q.defer();
          withPrismic(function(ctx) {
            ctx.api.form('everything').ref(ctx.ref).query('[[:d = at(document.id, "' + id + '")]]').submit(function(error, docs) {
              deferred.resolve(docs ? docs[0] : undefined);
            });
          });
          return deferred.promise;
        }

        function documents(ids) {
          var deferred = $q.defer();
          if (ids && ids.length) {
            withPrismic(function(ctx) {
              ctx.api.form('everything').ref(ctx.ref).query('[[:d = any(document.id, [' + (ids).map(function(id) {
                  return '"' + id + '"';
                }).join(',') + '])]]').submit(function(docs) {
                deferred.resolve(docs);
              });
            });
          }
          return deferred.promise;
        }

        function bookmarked(bookmark) {
          var id;
          withPrismic(function(ctx) {
            id = ctx.api.bookmarks[bookmark];
            if (id) {
              return document(id);
            } else {
              return $q.promise;
            }
          });
        }

        Configurer.init(service, config);
        service.all = all;
        service.query = query;
        service.document = document;
        service.documents = documents;
        service.bookmark = bookmarked;
        return service;
      }

      return createService(globalConfiguration);
    }];
  });