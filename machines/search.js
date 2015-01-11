module.exports = {
  friendlyName: 'Search',
  description: 'Search across all indexed fields, returning the ids of the documents which match the query.',
  extendedDescription: 'This will perform a full-text style query across all fields. The query string supports the Lucene query parser syntax and hence filters on specific fields (e.g. fieldname:value), wildcards (e.g. abc*) as well as a variety of options.',
  moreInfoUrl: 'http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search',
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
      description: 'The name of the index to search',
      extendedDescription: 'An "index" in ElasticSearch is a lot like a "database" in MySQL or MongoDB.',
      example: 'myindex',
      required: true
    },
    query: {
      description: 'The search query',
      example: 'cute dogs',
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
      description: 'Done.',
      example: ['f1913a1011-21940a0b1315-1939a193e1']
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

    client.search({
      q: inputs.query,
      _source : false,
      index: inputs.index
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

      // console.log(util.inspect(body, false, null));
      var hits = [];

      try {
        hits = body.hits.hits;
        hits = _.pluck(hits, '_id');
      }
      catch (e) {
        client.close();
        return exits.error(e);
      }

      client.close();
      return exits.success(hits);
    });
  },

};
