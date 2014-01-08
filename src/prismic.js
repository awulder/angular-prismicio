'use strict';

(function() {

  var module = angular.module('awulder.prismic-io', []);

  module.provider('Prismic', function() {
    this.$get = ['$window', '$http', '$q', function($window, $http, $q) {

      var defaultRequestHandler = function(url, callback) {
        $http.get(url).then(function(response) {
          callback(response.data)
        });
      };

      var defaultLinkResolver = function(ctx, doc) {
        return 'detail.html?id=' + doc.id + '&slug=' + doc.slug + ctx.maybeRefParam;
      };

      var parseQS = function(query) {
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
      };

      return function prismicFactory(options) {
        options = options || {};
        var prismic = options.prismic || $window.Prismic;
        var requestHandler = options.requestHandler || defaultRequestHandler;
        var apiEndPoint = options.apiEndPoint || '';
        var accessToken = options.accessToken || '';
        var linkResolver = options.linkResolver || defaultLinkResolver;
        // var clientId = options.clientId || '';
        // var clientSecret = options.clientSecret || '';

        var getApiHome = function(callback) {
          prismic.Api(apiEndPoint, callback, accessToken, requestHandler);
        };

        var buildContext = function(ref, callback) {
          getApiHome(function(api) {
            var ctx = {
              ref: (ref || api.data.master.ref),
              api: api,
              maybeRef: (ref && ref != api.data.master.ref ? ref : ''),
              maybeRefParam: (ref && ref != api.data.master.ref ? '&ref=' + ref : ''),
              oauth: function() {
                return {
                  accessToken: accessToken,
                  hasPrivilegedAccess: !!accessToken
                }
              },
              linkResolver: linkResolver
            };
            callback(ctx);
          });
        };

        var withPrismic = function(callback) {
          buildContext(queryString['ref'], function(ctx) {
            callback.apply($window, [ctx]);
          });
        };

        var queryString = parseQS($window.location.search.substring(1));

        var encodedHash = parseQS($window.location.hash.substring(1));

        return {
          getDocument: function(id) {
            var deferred = $q.defer();
            withPrismic(function(ctx) {
              ctx.api.forms('everything').ref(ctx.ref).query('[[:d = at(document.id, "' + id + '")]]').submit(function(results) {
                deferred.resolve(_.first(results));
              });
            });
            return deferred.promise;
          },

          getDocuments: function(ids) {
            var deferred = $q.defer();
            if (ids && ids.length) {
              withPrismic(function(ctx) {
                ctx.api.forms('everything').ref(ctx.ref).query('[[:d = any(document.id, [' + _(ids).map(function(id) {
                    return '"' + id + '"';
                  }).join(',') + '])]]').submit(function(results) {
                  deferred.resolve(results);
                });
              });
            }
            return deferred.promise;
          },

          getBookmark: function(bookmark) {
            var deferred = $q.defer();
            var id = ctx.api.bookmarks[bookmark];
            if (id) {
              this.getDocument(id);
            }
            return deferred.promise;
          }
        };
      };
    }]
  });
})();