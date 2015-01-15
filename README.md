# angular-prismicio

[![Build Status](https://travis-ci.org/awulder/angular-prismicio.png?branch=master)](https://travis-ci.org/awulder/angular-prismicio) [![Analytics](https://ga-beacon.appspot.com/UA-43175169-2/angular-prismicio/readme)](https://github.com/igrigorik/ga-beacon)

AngularJS service for [prismic.io](http://prismic.io/).

## How do I add this to my project?

You can download it manually by clicking [here to download development unminified version](https://raw.github.com/awulder/angular-prismicio/master/dist/angular-prismicio.js) or [here to download minified production version](https://raw.github.com/awulder/angular-prismicio/master/dist/angular-prismicio.min.js)

## Dependencies

* [Angular](http://angularjs.org/)
* [Prismic.io SDK](https://developers.prismic.io/documentation/VBgeDDYAADMAz2Rw/developers-manual)

## Usage instructions

First you need to configure the `PrismicProvider`. You can configure the following parameters where the API Endpoint is mandatory.

* API Endpoint (`setApiEndpoint`)
* Access token if the Master is not open (`setAccessToken`)
* OAuth (`setClientId`, `setClientSecret`, `setOAuthScope`)
* Links resolution rules (`setLinkResolver`)

You can configure the `PrismicProvider` in the `config`
````javascript
var app = angular.module('app', ['prismic.io']);

app.config(function(PrismicProvider) {
    PrismicProvider.setApiEndpoint('https://lesbonneschoses.prismic.io/api');
    PrismicProvider.setAccessToken('');
    PrismicProvider.setClientId('');
    PrismicProvider.setClientSecret('');
    PrismicProvider.setLinkResolver(function(ctx, doc) {
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
}]);
````

## Documentation
These are the methods that can be called on the `Prismic` object:
* `Prismic.all()`
* `Prismic.query(predicateBasedQueryString)`
* `Prismic.document(idString)`
* `Prismic.documents(idsArray)`
* `Prismic.bookmark(bookmarkString)`

Or for more advanced queries using the underlying objects of the JS kit:
* `Prismic.api()`
* `Prismic.ctx()`

### OAuth methods

* `Prismic.authenticationUrl(maybeRedirectUri)` : get the OAuth authentication URL on Prismic web site

### Prismic directives

The prismicHtml-directive can be used as follows
````javascript
<prismic-html fragment="data.fragment"></prismic-html>
````
or as
````javascript
<div prismic-html fragment="data.fragment"></div>
````
where 'fragment' is a prismic.io type/value object.

## Contributting
New contributions are always welcomed. Just open a pull request making sure that it contains tests and documentation updates.

## License
MIT
