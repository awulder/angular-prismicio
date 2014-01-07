# angular-prismic-io [![Build Status](https://travis-ci.org/awulder/angular-prismic-io.png?branch=master)](https://travis-ci.org/awulder/angular-prismic-io)
Bower Component for using AngularJS with [prismic.io](http://prismic.io/).

## Install

1. `bower install angular-prismic-io` or [download the zip](https://github.com/awulder/angular-prismic-io/archive/master.zip).

## Usage

## API

### `prismic.getDocument`
Takes id and returns a promise

### `prismic.getDocuments`
Takes an array of id's and returns a promise.

### `prismic.getBookmark`
Takes bookmark and returns a promise

### `prismic.query` (NOT IMPLEMENTED YET)
Takes a predicate and returns a promise.

#### Examples

```javascript
angular.module('myApp', ['awulder.prismic-io']);
```

## License
MIT