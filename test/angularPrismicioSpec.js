'use strict';

describe('Prismic', function() {
  var $httpBackend, Prismic, result;

  var apiEndpoint = 'https://lesbonneschoses.prismic.io/api';

  var contextResponse = function() {
    return {
      "refs": [
        {
          "ref": "UkL0hcuvzYUANCrm",
          "label": "Master",
          "isMasterRef": true
        }
      ],
      "bookmarks": {
        "products": "UkL0gMuvzYUANCpt"
      },
      "types": {
        "product": "Product"
      },
      "tags": [],
      "forms": {
        "everything": {
          "method": "GET",
          "enctype": "application/x-www-form-urlencoded",
          "action": "https://lesbonneschoses.prismic.io/api/documents/search",
          "fields": {
            "ref": {
              "type": "String",
              "multiple": false
            },
            "q": {
              "type": "String",
              "multiple": true
            },
            "page": {
              "type": "Integer",
              "multiple": false,
              "default": "1"
            },
            "pageSize": {
              "type": "Integer",
              "multiple": false,
              "default": "20"
            },
            "orderings": {
              "type": "String",
              "multiple": false
            }
          }
        }
      },
      "oauth_initiate": "https://lesbonneschoses.prismic.io/auth",
      "oauth_token": "https://lesbonneschoses.prismic.io/auth/token"
    };
  };

  var searchResponse = function() {
    return {
      results: [
        {
          id: 'UkL0gMuvzYUANCpf',
          type: 'product',
          href: '',
          tags: [],
          slug: '-',
          fragments: {},
          data: {}
        }
      ]
    };
  };

  beforeEach(module('prismic.io'));

  beforeEach(inject(function(_$httpBackend_, _Prismic_) {
    $httpBackend = _$httpBackend_;
    Prismic = _Prismic_;
    Prismic.setApiEndpoint(apiEndpoint);
  }));

  beforeEach(function() {
    $httpBackend.expectGET(apiEndpoint).respond(contextResponse());
  });

  afterEach(function() {
    $httpBackend.flush()
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('method descriptions', function() {
    it('should issue GET query', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%3Ad%20%3D%20at(document.type%2C%20%22product%22)%5D')
        .respond(searchResponse());

      Prismic.query('[:d = at(document.type, "product")]').then(function(queryResult) {
        result = queryResult;
      });
    });

    it('should raise error GET query', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%3Ad%20%3D%20at(document.type%2C%20%22product%22)%5D')
        .respond(404, "Not found");

      Prismic.query('[:d = at(document.type, "product")]').then(function(queryResult) {
        result = queryResult;
        expect(result).toBeUndefined();
      });
    });

    it('should issue GET all', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm')
        .respond(searchResponse());

      Prismic.all().then(function(queryResult) {
        result = queryResult;
      });
    });

    it('should raise error GET all', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm')
        .respond(404, "Not found");

      Prismic.all().then(function(queryResult) {
        result = queryResult;
        expect(result).toBeUndefined();
      });
    });

    it('should issue GET documentTypes', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%5B%3Ad%20%3D%20at(document.type%2C%20%22product%22)%5D%5D')
        .respond(searchResponse());

      Prismic.documentTypes('product').then(function(queryResult) {
        result = queryResult;
      });
    });

    it('should issue GET document', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%5B%3Ad%20%3D%20at(document.id%2C%20%221%22)%5D%5D')
        .respond(searchResponse());

      var expectedResponse = searchResponse();
      Prismic.document(1).then(function(queryResult) {
        result = queryResult;
        expect(result.id).toEqual(expectedResponse.results[0].id);
      });
    });

    it('should issue GET documents', function() {
      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%5B%3Ad%20%3D%20at(document.id%2C%20%221%22)%5D%5D')
        .respond(searchResponse());

      Prismic.document(1).then(function(queryResult) {
        result = queryResult;
      });
    });

//    it('should issue GET bookmark', function() {
//      $httpBackend.expectGET(apiEndpoint).respond(contextResponse());
//      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%5B%3Ad%20%3D%20at(document.id%2C%20%221%22)%5D%5D')
//        .respond();
//      $httpBackend.expectGET(apiEndpoint + '/documents/search?page=1&pageSize=20&ref=UkL0hcuvzYUANCrm&q=%5B%5B%3Ad%20%3D%20at(document.id%2C%20%221%22)%5D%5D')
//        .respond(searchResponse());
//
//      Prismic.bookmark('products').then(function(queryResult) {
//        result = queryResult;
//      });
//    });
  });
});

describe('prismicHtml', function() {
  var $scope, $compile, result;
  var fragment = function(type, value) {
    return {
      "type": type,
      "value": value
    }
  };

  beforeEach(module('prismic.io'));

  beforeEach(inject(function(_$rootScope_, _$compile_) {
    $scope = _$rootScope_;
    $compile = _$compile_;
  }));

  describe('directive method descriptions', function() {
    var compileDirective = function (markup, scope) {
      var el = $compile(markup)(scope);
      scope.$digest();
      return el;
    };

    it('should contain <span> when type is Text', function() {
      $scope.fragment = fragment("Text", "Some value");
      var textType = compileDirective('<prismic-html fragment="fragment"></prismic-html>', $scope);
      result = textType[0];
      expect(result.innerHTML).toContain("<span");
    });

    it('should contain <img> when type is Image', function() {
      $scope.fragment = fragment("Image", {
       main: {
        alt: "",
        copyright: "",
        dimensions: {
          height: 500,
          width: 500
        },
        url: "https://prismic-io.s3.amazonaws.com/lesbonneschoses/604400b41b2e275ee766bd69b69b33734043aa38.png"
        }});
      var imageType = compileDirective('<prismic-html fragment="fragment"></prismic-html>', $scope);
      result = imageType[0];
      expect(result.innerHTML).toContain("<img");
    });
  });

});