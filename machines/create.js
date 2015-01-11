module.exports = {
  friendlyName: 'Create document',
  description: 'Store the provided document (a dictionary), making it searchable.',
  moreInfoUrl: 'http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-index',
  inputs: {
    hostname: {
      description: 'The hostname of your ElasticSearch server',
      example: 'localhost',
      required: true,
      whereToGet: {
        description: 'Copy the hostname of your ElasticSearch server',
        extendedDescription: 'i.e. if you are using a hosted ElasticSearch instance at "bae23592g23523.some-hosted-service.com", that is your hostname.  If you are running ElasticSearch locally, this will be "localhost".'
      }
    },
    port: {
      description: 'The port your ElasticSearch server is running on',
      defaultsTo: 9200,
      example: 9200,
      whereToGet: {
        description: 'Copy the port of your ElasticSearch server',
        extendedDescription: 'The conventional port number for ElasticSearch servers is 9200.'
      }
    },
    index: {
      description: 'The name of the index where the document should be stored',
      extendedDescription: 'An "index" in ElasticSearch is a lot like a "database" in MySQL or MongoDB.',
      example: 'myindex',
      required: true,
    },
    type: {
      description: 'The "type" of this document',
      defaultsTo: 'default',
      example: 'user'
    },
    document: {
      description: 'The document to store',
      typeclass: 'dictionary',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.'
    },
    couldNotConnect: {
      description: 'Could not connect to ElasticSearch at the provided hostname and port, or all connections in the ES client pool are "dead".',
      extendedDescription: 'See http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/errors.html'
    },
    noSuchIndex: {
      description: 'The specified index does not exist',
    },
    success: {
      description: 'Returns the unique id of the document.',
      example: 'lzmkDgMjTbGoacxLMsB_zA'
    }
  },
  fn: function(inputs, exits) {

    var util = require('util');
    var _ = require('lodash');
    var elasticsearch = require('elasticsearch');

    var client = new elasticsearch.Client({
      host: util.format('%s:%d', inputs.hostname, inputs.port||9200),
      log: require('../helpers/noop-logger')
    });

    client.index({
      index: inputs.index,
      type: inputs.type||'default',
      // id: '1',
      body: {
        doc: inputs.document
      },
    }, function (err, body) {
      if (err) {
        client.close();
        if (typeof err !== 'object' || typeof err.message !== 'string'){
          return exits.error(err);
        }
        if (err.constructor && err.constructor.name === 'NoConnections' || err.message.match(/No Living connections/)){
          return exits.couldNotConnect();
        }
        if (err.message.match(/IndexMissingException/)){
          return exits.noSuchIndex();
        }
        return exits.error(err);
      }

      var id;
      try {
        id = body._id;
        if (!body.created){
          throw new Error('Expected response from ElasticSearch to contain the `created` property');
        }
      }
      catch (e) {
        client.close();
        return exits.error(e);
      }

      client.close();
      return exits.success(id);
    });
  },

};
