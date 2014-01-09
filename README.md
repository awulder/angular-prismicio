# angular-prismic-io

[![Build Status](https://travis-ci.org/awulder/angular-prismic-io.png?branch=master)](https://travis-ci.org/awulder/angular-prismic-io) [![Analytics](https://ga-beacon.appspot.com/UA-43175169-2/angular-prismic-io/README)](https://github.com/igrigorik/ga-beacon)

Component for using AngularJS with [prismic.io](http://prismic.io/).

## How do I add this to my project?

You can download this by:

* Using bower and running `bower install angular-prismic-io`
* Using npm and running `npm install angular-prismic-io`
* Downloading it manually by clicking [here to download development unminified version](https://raw.github.com/awulder/angular-prismic-io/master/dist/angular-prismic-io.js) or [here to download minified production version](https://raw.github.com/awulder/angular-prismic-io/master/dist/angular-prismic-io.min.js)

## Dependencies

angular-prismic-io depends on [Angular](http://angularjs.org/) and [Underscore](http://underscorejs.org/).

## Usage instructions

First you need to configure the `PrismicProvider`. You can configure the following parameters where the API Endpoint is mandatory.

* API Endpoint (`setApiEndpoint`)
* Access token if the Master is not open (`setAccessToken`)
* OAuth (`setClientId`, `setClientSecret`)
* Links resolution rules (`setLinkResolver`)

You can configure the `PrismicProvider` in the `config`
````javascript
var app = angular.module('app', ['prismic.io']);

app.config(function(PrismicProvider) {
    PrismicProvider.setApiEndpoint('https://lesbonneschoses.prismic.io/api');
    PrismicProvider.setAccessToken('');
    PrismicProvider.setClientId('');
    PrismicProvider.setClientSecret('');
    RestangularProvider.setLinkResolver(function(ctx, doc) {
        return 'detail.html?id=' + doc.id + '&slug=' + doc.slug + ctx.maybeRefParam;
    });
});
````

As soon as the above is done you are ready to inject `PrismicProvider` in your services and controllers:
````javascript
app.controller('AppCtrl', ['Prismic', function(Prismic) {
    var self = this;
    Prismic.all().then(function(data) {
        self.data = data;
    });
});
````

## Documentation
These are the methods that can be called on the `Prismic` object:
* `Prismic.all()`
* `Prismic.query(predicateBasedQueryString)`
* `Prismic.document(idString)`
* `Prismic.documents(idsArray)`
* `Prismic.bookmark(bookmarkString)`

## License
MIT