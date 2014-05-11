/**
 * AngularJS service for prismic.io
 * @version v0.1.0 - 2014-05-11
 * @link 
 * @author Arjan Wulder <arjanwulder@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
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

      config.linkResolver = angular.isUndefined(config.linkResolver) ? function(){} : config.linkResolver;
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
        var context;

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

            if (api) {
              context = {
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
              callback(null, context);
            } else {
              callback(error, null);
            }
          });
        }

        function withPrismic(callback) {
          if (!context) {
            buildContext(queryString['ref'], function(error, ctx) {
              callback(error, ctx);
            });
          } else {
            callback(null, context);
          }
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
          withPrismic(function(error, ctx) {
            if (ctx) {
              ctx.api.form('everything').ref(ctx.ref).submit(function(error, docs) {
                deferred.resolve(docs);
              });
            } else {
              deferred.reject(error);
            }
          });
          return deferred.promise;
        }

        function query(predicateBasedQuery) {
          var deferred = $q.defer();
          withPrismic(function(error, ctx) {
            ctx.api.forms('everything').ref(ctx.ref).query(predicateBasedQuery).submit(function(error, docs) {
              deferred.resolve(docs);
            });
          });
          return deferred.promise;
        }

        function documentTypes(documentType) {
          var deferred = $q.defer();
          withPrismic(function(error, ctx) {
            if (ctx) {
              ctx.api.form('everything').ref(ctx.ref).query('[[:d = at(document.type, "' + documentType + '")]]').submit(function(error, types) {
                types ? deferred.resolve(types) : deferred.reject(error);
              });
            } else {
              deferred.reject(error);
            }
          });
          return deferred.promise;
        }

        /**
        * Fetch a single item by supplying the id of the document
        * @param id
        * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
        */
        function document(id) {
          var deferred = $q.defer();
          withPrismic(function(error, ctx) {
            if (ctx) {
              ctx.api.form('everything').ref(ctx.ref).query('[[:d = at(document.id, "' + id + '")]]').submit(function(error, docs) {
                docs ? deferred.resolve(docs.results[0]) : deferred.reject(error);
              });
            } else {
              deferred.reject(error);
            }
          });
          return deferred.promise;
        }

        function documents(ids) {
          var deferred = $q.defer();
          if (ids && ids.length) {
            withPrismic(function(error, ctx) {
              if (ctx) {
                ctx.api.form('everything').ref(ctx.ref).query('[[:d = any(document.id, [' + (ids).map(function(id) {
                    return '"' + id + '"';
                  }).join(',') + '])]]').submit(function(docs) {
                  deferred.resolve(docs);
                });
              } else {
                deferred.reject(error);
              }
            });
          }
          return deferred.promise;
        }

        function bookmarked(bookmark) {
          var id;
          withPrismic(function(ctx, error) {
            if (ctx) {
              id = ctx.api.bookmarks[bookmark];
              if (id) {
                return document(id);
              } else {
                return $q.promise;
              }
            } else {
              $q.reject(error);
            }
          });
        }

        Configurer.init(service, config);
        service.all = all;
        service.query = query;
        service.documentTypes = documentTypes;
        service.document = document;
        service.documents = documents;
        service.bookmark = bookmarked;
        return service;
      }

      return createService(globalConfiguration);
    }];
  })

  // The directive uses prismics asHtml and can be used as <prismic-html fragment="data.fragment">
  .directive('prismicHtml', ['$window', 'Prismic', function($window, Prismic) {
    return {
      restrict: 'E',
      scope: {
        fragment : '=fragment'
      },
      link: function(scope, element, attrs) {
        // Watch the fragment, if it changes, change the html
        scope.$watch('fragment', function(oldVal, newVal) {
          var field = $window.Prismic.Fragments.initField(scope.fragment);
          if(field) {
            // Use the PrismicProvider configuration for ctx
            var html = field.asHtml(Prismic.configuration);
            element[0].innerHTML = html;
          }
        });
      }
    };
  }]);