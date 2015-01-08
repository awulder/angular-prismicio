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

      // Set this to true if you want to use prismic.ios default request handler
      config.usePrismicDefaultRequestHandler = angular.isUndefined(config.usePrismicDefaultRequestHandler) ? false : config.usePrismicDefaultRequestHandler;
      object.setUsePrismicDefaultRequestHandler = function(usePrismicDefaultRequestHandler) {
        config.usePrismicDefaultRequestHandler = usePrismicDefaultRequestHandler;
      };

      // This value is defined on Prismic "API & Security" configuration page, associated with the "client_id"
      // Example: "master", "master+releases", ...
      config.oauthScope = angular.isUndefined(config.oauthScope) ? '' : config.oauthScope;
      object.setOAuthScope = function(oauthScope) {
        config.oauthScope = oauthScope;
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

          var configHttp = {
            headers: {
              'Accept': 'application/json'
            }
          };

          $http.get(url, configHttp).then(
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

          prismic.Api(config.apiEndpoint, callback, config.accessToken, config.usePrismicDefaultRequestHandler ? undefined : requestHandler);

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
         * Get the OAuth authentification URL on Prismic web site.
         *
         * For instance: Prismic.getAuthenticationUrl(redirectUrl).then(function(url){ ..... });
         *
         * clientId and oauthScope must be provided.
         *
         * @param {string} maybeRedirectUri Optional URI where to redirect after Prismic's authentication. This URL must
         * be registered as authorized in "API & Security" configuration page of your Prismic instance. If not provided,
         * current window.locatin URL is used.
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function authenticationUrl(maybeRedirectUri) {
          return api().then(function(api) {
            // Use current URL if redirect URI is not provided
            var redirectUri = maybeRedirectUri || $window.location;

            var url = api.data.oauthInitiate +
              "?response_type=token" +
              "&client_id=" + encodeURIComponent(config.clientId) +
              "&redirect_uri=" + encodeURIComponent(redirectUri) +
              "&scope=" + encodeURIComponent(config.oauthScope);
            return $q.when(url);
          });
        }

        /**
         * Fetch all the items by supplying configuration.
         *
         * @param {string} predicate Prismic predicate (mandatory), but empty predicate leads to Prismic's query without predicate.
         * @param resultExtraction Mandatory function (results -> *) to extract your result from Prismic results (mandatory)
         * @param additionalSearchParams Optional function (SearchForm -> SearchForm) to add additional Prismic search parameters, such as 'page(), pageSize() or orderings()'.
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function queryWithConfiguration(predicate, resultExtractor, additionalSearchParams) {
          return withPrismic().then(function(ctx) {
            var deferred = $q.defer();

            var searchForm = ctx.api.forms('everything').ref(ctx.ref);

            if ("" !== predicate) {
              searchForm = searchForm.query(predicate);
            }

            if (additionalSearchParams) {
              searchForm = additionalSearchParams(searchForm);
            }

            searchForm.submit(function(error, docs) {
              if (docs) {
                deferred.resolve(resultExtractor(docs));
              } else {
                deferred.reject(error);
              }
            });

            return deferred.promise;
          });
        }

        /**
         * Fetch all the items.
         *
         * For instance:
         *     Prismic.all().then(...)
         *
         *     Prismic.all(function(searchForm) {
         *       return searchForm.page(3).pageSize(50);
         *     }).then(...)
         *
         * @param additionalSearchParams Optional function (SearchForm -> SearchForm) to add additional Prismic search parameters, such as 'page(), pageSize() or orderings()'.
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function all(additionalSearchParams) {
            return query("", additionalSearchParams);
        }

        /**
         * Fetch all the items by supplying a query predicate.
         *
         * For instance:
         *   Prismic.query('[[:d = at(document.type, "product")]]').then(...)
         *
         *   Prismic.query('[[:d = at(document.type, "product")]]', function(searchForm) {
         *     return searchForm.page(5).pageSize(60);
         *   }).then(...)
         *
         * @param {string} predicate Prismic predicate (mandatory). Empty predicate leads to Prismic's query without predicate (see #all())
         * @param additionalSearchParams Optional function (SearchForm -> SearchForm) to add additional Prismic search parameters, such as 'page(), pageSize() or orderings()'.
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function query(predicate, additionalSearchParams) {
          return queryWithConfiguration(predicate, function(docs) { return docs; }, additionalSearchParams);
        }

        /**
         * Fetch all the items by supplying a document type.
         *
         * For instance:
         *
         *   Prismic.documentTypes('product').then(...)
         *
         * @param documentType Type of the documents to query
         * @param additionalSearchParams Optional function (SearchForm -> SearchForm) to add additional Prismic search parameters, such as 'page(), pageSize() or orderings()'.
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function documentTypes(documentType, additionalSearchParams) {
          var predicate = '[[:d = at(document.type, "' + documentType + '")]]';
          return query(predicate, additionalSearchParams);
        }

        /**
        * Fetch a single item by supplying the id of the document.
        *
        * @param id Prismic id
        * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
        */
        function document(id) {
          var predicate = '[[:d = at(document.id, "' + id + '")]]';
          return queryWithConfiguration(predicate, function(docs) { return docs.results[0]; });
        }

        /**
         * Fetch all items by supplying all ids of the documents.
         * For instance:
         *
         *   Prismic.documents([...], function(searchForm) {
         *     return searchForm.page(3).pageSize(10);
         *   }).then(...)
         *
         * @param {string[]} ids All ids
         * @param additionalSearchParams Optional function (SearchForm -> SearchForm) to add additional Prismic search parameters, such as 'page(), pageSize() or orderings()'.
         * @returns {ng.IPromise<T>|promise|*|Promise.promise|Q.promise}
         */
        function documents(ids, additionalSearchParams) {
          if (ids && ids.length) {

            var predicate = '[[:d = any(document.id, [' +
              (ids).map(function(id) {
                return '"' + id + '"';
              })
              .join(',') + '])]]';

            return query(predicate, additionalSearchParams);
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
        service.authenticationUrl = authenticationUrl;
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

  /**
   * The directive uses prismics asHtml and can be used as <prismic-html fragment="data.fragment"> or
   * as <div prismic-html fragment="data.fragment">
   */
  .directive('prismicHtml', ['$window', 'Prismic', function($window, Prismic) {
    return {
      restrict: 'AE',
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
