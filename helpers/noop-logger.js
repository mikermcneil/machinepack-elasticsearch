/**
 * Because ElasticSearch requires a constructor to be provided to override default logging,
 * we must provide a noop logger here.
 *
 * For details, see:
 * http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/logging.html
 */

module.exports = function NoopLogger(config) {
  // config is the object passed to the ES client constructor.
  this.error = function (){};
  this.warning = function (){};
  this.info = function (){};
  this.debug = function (){};
  this.trace = function (){};
  this.close = function () { /* a noop logger does not need to be closed */ };
};
