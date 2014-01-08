# angular-prismic-io

[![Build Status](https://travis-ci.org/awulder/angular-prismic-io.png?branch=master)](https://travis-ci.org/awulder/angular-prismic-io) [![Analytics](https://ga-beacon.appspot.com/UA-43175169-2/angular-prismic-io/README)](https://github.com/igrigorik/ga-beacon)

Component for using AngularJS with [prismic.io](http://prismic.io/).

## How do I add this to my project?

You can download this by:

* Using bower and running `bower install angular-prismic-io`
* Using npm and running `npm install angular-prismic-io`
* Downloading it manually by clicking [here to download development unminified version](https://raw.github.com/awulder/angular-prismic-io/master/dist/angular-prismic-io.js) or [here to download minified production version](https://raw.github.com/awulder/angular-prismic-io/master/dist/angular-prismic-io.min.js)

## Dependencies

angular-prismic-io depends on Angular and Lodash (or Underscore).

## Usage

### Configuring angular-prismic-io

#### Properties
angular-prismic-io comes with a default LinkResolver.

##### setApiEndPoint

##### setAccessToken

##### setClientId

##### setClientSecret

##### setLinkResolver

#### How to configure them globally

##### Configuring in the `config`
````javascript
app.config(function(PrismicProvider) {
    PrismicProvider.setApiEndPoint('http://www.prismic.io/api');
    PrismicProvider.setAccessToken('');
    PrismicProvider.setClientId('');
    PrismicProvider.setClientSecret('');
    RestangularProvider.setLinkResolver(function(ctx, doc) {
        return 'detail.html?id=' + doc.id + '&slug=' + doc.slug + ctx.maybeRefParam;
    });
});
````

### Methods description
These are the methods that can be called on the Prismic object:
* **all()**:
* **query(predicate)**:
* **document(id)**:
* **documents(ids)**:
* **bookmark(bookmark)**:

## License
MIT