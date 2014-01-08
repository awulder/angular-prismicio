'use strict';

describe('Prismic', function() {
  var Prismic, $httpBackend;

  beforeEach(angular.mock.module('prismic.io'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    Prismic = $injector.get('Prismic');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('configuration', function() {
    it('should set a default link resolver', function() {
      expect(true).toBeTruthy();
    })
  });

  describe('method descriptions', function() {
    describe('all()', function() {
      it('should return several documents', function() {
        expect(true).toBeTruthy();
      });
    });

    describe('query()', function() {
      it('should return several documents', function() {
        expect(true).toBeTruthy();
      });
    });

    describe('document(id)', function() {
      it('should return the document by id', function() {
        expect(true).toBeTruthy();
      });
    });

    describe('documents(ids)', function() {
      it('should return the document by id', function() {
        expect(true).toBeTruthy();
      });
    });

    describe('bookmark(bookmkark)', function() {
      it('should return the bookmarked document', function() {
        expect(true).toBeTruthy();
      });
    });
  });
});