module.exports = {
  friendlyName: 'Delete document',
  description: 'Delete the document with the specified unique id.',
  moreInfoUrl: 'http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-delete',
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
      description: 'The name of the index where the document is stored',
      extendedDescription: 'An "index" in ElasticSearch is a lot like a "database" in MySQL or MongoDB.',
      example: 'myindex',
      required: true,
    },
    type: {
      description: 'The "type" of the document to delete',
      defaultsTo: 'default',
      example: 'user'
    },
    id: {
      description: 'The unique id of the document to delete',
      example: 'lzmkDgMjTbGoacxLMsB_zA',
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
    documentNotFound: {
      description: 'No document with the specified id and type exists in this index',
    },
    success: {
      description: 'Done.'
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

    client.delete({
      index: inputs.index,
      type: inputs.type||'default',
      id: inputs.id
    }, function (err, body) {
      if (err) {
        client.close();
        if (typeof err !== 'object' || typeof err.message !== 'string'){
          return exits.error(err);
        }
        if (err.constructor && err.constructor.name === 'NoConnections' || err.message.match(/No Living connections/)){
          return exits.couldNotConnect();
        }
        if (err.message.match(/Not Found/)) {
          return exits.documentNotFound();
        }
        if (err.message.match(/IndexMissingException/)){
          return exits.noSuchIndex();
        }
        return exits.error(err);
      }
      // console.log(body);

      // try {
      //   if (body.created) {
      //     throw new Error('Expected response from ElasticSearch to specify `created:false`');
      //   }
      // }
      // catch (e) {
      //   client.close();
      //   return exits.error(e);
      // }

      client.close();
      return exits.success();
    });
  },

};
