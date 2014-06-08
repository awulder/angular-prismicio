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
        var maybeContext;
        var maybeApi;

        function requestHandler(url, callback) {
          $http.get(url).then(
            function(response) {
              callback(null, response.data);
            },
            function(error) {
              callback(error, null);
            });
        }

        function getApiHome() {
          var deferred = $q.defer();
          var callback = function(error, api) {
              if (api) {
                  deferred.resolve(api);
              } else {
                  deferred.reject(error) ;
              }
          };

          prismic.Api(config.apiEndpoint, callback, config.accessToken, requestHandler);

          return deferred.promise;
        }

        function buildContext(ref) {
          maybeApi = getApiHome().then(function(api) {
            var context = {
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
            return context;
          });
          return maybeApi;
        }

        function withPrismic() {
            if (maybeContext) {
              // Promise already resolved
              return maybeContext;
            } else {
              maybeContext = buildContext(queryString['ref']);
              return maybeContext;
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

        /**
         * Builds a useable Api object to use, as described in the official prismic.io JS kit.
         *
         * For instance: Prismic.api().then(function(api){ api.form('everything')...... });
         *
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function api() {
          return withPrismic().then(function(ctx) {
            var deferred = $q.defer();
            deferred.resolve(ctx.api);
            return deferred.promise;
          });
        }

        /**
         * Builds a useable ctx object to use, as described in the official prismic.io JS kit.
         *
         * For instance: Prismic.ctx().then(function(ctx){ ..... ctx.ref ..... });
         *
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function ctx() {
          return withPrismic().then(function(ctx) {
            var deferred = $q.defer();
            deferred.resolve(ctx);
            return deferred.promise;
          });
        }

        /**
         * Fetch all the items.
         *
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function all() {
            return withPrismic().then(function(ctx) {
                var deferred = $q.defer();

                ctx.api.form('everything').ref(ctx.ref).submit(function(error, docs) {
                  if (docs) {
                    deferred.resolve(docs);
                  } else {
                    deferred.reject(error);
                  }
                });

                return deferred.promise;
            });
        }

        /**
         * Fetch all the items by supplying a query.
         * 
         * @param predicateBasedQuery Prismic predicate
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function query(predicateBasedQuery) {
          return withPrismic().then(function(ctx) {
            var deferred = $q.defer();

            ctx.api.forms('everything').ref(ctx.ref).query(predicateBasedQuery).submit(function(error, docs) {
              if (docs) {
                deferred.resolve(docs);
              } else {
                deferred.reject(error);
              }
            });

            return deferred.promise;
          });
        }

        /**
         * Fetch all the items by supplying a document type.
         * 
         * @param documentType Type of the documents to query
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function documentTypes(documentType) {
          return withPrismic().then(function(ctx) {
            var deferred = $q.defer();

            ctx.api.form('everything').ref(ctx.ref).query('[[:d = at(document.type, "' + documentType + '")]]')
              .submit(function(error, types) {
              if (types) {
                deferred.resolve(types);
              } else {
                deferred.reject(error);
              }
            });

            return deferred.promise;
          });
        }

        /**
        * Fetch a single item by supplying the id of the document.
        * 
        * @param id
        * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
        */
        function document(id) {
          return withPrismic().then(function(ctx) {
            var deferred = $q.defer();
  
            ctx.api.form('everything').ref(ctx.ref).query('[[:d = at(document.id, "' + id + '")]]')
              .submit(function(error, docs) {
              if (docs) {
                deferred.resolve(docs.results[0]);
              } else {
                deferred.reject(error);
              }
            });

            return deferred.promise;
          });
        }

        /**
         * Fetch all items by supplying all ids of the documents.
         * 
         * @param ids All ids
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function documents(ids) {
          if (ids && ids.length) {
            return withPrismic().then(function(ctx) {
              var deferred = $q.defer();

              ctx.api.form('everything').ref(ctx.ref).query('[[:d = any(document.id, [' + (ids)
                .map(function(id) {
                  return '"' + id + '"';
                })
                .join(',') + '])]]')
                .submit(function(error, docs) {
                  if (docs) {
                    deferred.resolve(docs);
                  } else {
                    deferred.reject(error);
                  }
                });

              return deferred.promise;
            });
          } else {
            $q.reject("Ids must be provided");
          }
        }

        function bookmarked(bookmark) {
          return withPrismic().then(function(ctx) {
            var id = ctx.api.bookmarks[bookmark];
            if (id) {
              return document(id);
            } else {
              return $q.reject("Bookmark not found");
            }
          });
        }

        Configurer.init(service, config);
        service.api = api;
        service.ctx = ctx;
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
          if (scope.fragment) {
            var field = $window.Prismic.Fragments.initField(scope.fragment);
            if(field) {
              // Use the PrismicProvider configuration for ctx
              var html = field.asHtml(Prismic.configuration);
              element[0].innerHTML = html;
            }
          }
        });
      }
    };
  }]);