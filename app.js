// const vcapServices = require('vcap_services');
const queryBuilder = require('./src/query-builder');

const NEWS_ENVIRONMENT_ID = 'system';
const NEWS_COLLECTION_ID = 'news-ja';

const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

let creds;
if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  creds = services.discovery[0].credentials;
} else {
  creds = {
    username: null,
    password: null,
  };
}

// const VERSION_DATE = '2017-08-01'
const VERSION_DATE = '2018-08-01';
let discovery;
if (process.env.DISCOVERY_IAM_APIKEY && process.env.DISCOVERY_IAM_APIKEY !== '') {
  discovery = new DiscoveryV1({
    version: VERSION_DATE,
    iam_apikey: process.env.DISCOVERY_IAM_APIKEY || '<iam_apikey>',
    iam_url: process.env.DISCOVERY_IAM_URL || 'https://iam.bluemix.net/identity/token',
    url: process.env.DISCOVERY_URL || 'https://gateway.watsonplatform.net/discovery/api',
  });
} else {
  discovery = new DiscoveryV1({
    version: VERSION_DATE,
    username: creds.username || process.env.DISCOVERY_USERNAME || '<username>',
    password: creds.password || process.env.DISCOVERY_PASSWORD || '<password>',
    url: process.env.DISCOVERY_URL || 'https://gateway.watsonplatform.net/discovery/api',
  });
}

// Bootstrap application settings
const express = require('express');
const path = require('path');

const app = express();
require('./config/express')(app);

function getWidgetQuery(request) {
  const widgetQueries = request.query.widgetQueries;

  if (!widgetQueries) {
    return null;
  }

  return widgetQueries.split(',')
    .reduce((widgetQuery, finalWidgetQuery) => {
      const queryBuilderWidgetQuery = queryBuilder.widgetQueries[widgetQuery];

      if (queryBuilderWidgetQuery) {
        const widgetAggregations = queryBuilderWidgetQuery.aggregations;

        if (widgetAggregations) {
          const currentAggregations = finalWidgetQuery.aggregations || [];
          delete queryBuilderWidgetQuery.aggregations;

          return Object.assign({}, finalWidgetQuery, queryBuilderWidgetQuery, {
            aggregations: currentAggregations.concat(widgetAggregations),
          });
        }
      }
      return Object.assign({}, finalWidgetQuery, queryBuilderWidgetQuery);
    }, {});
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// setup query endpoint for news
app.post('/api/query', (req, res, next) => {
  console.log('/api/query -------');
  const queryParams = queryBuilder.build(req.body, getWidgetQuery(req));

  if (queryParams.aggregations) {
    queryParams.aggregation = `[${queryParams.aggregations.join(',')}]`;
    delete queryParams.aggregations;
  }
  console.log('PARAMS', queryParams);

  const params = Object.assign({}, queryParams, {
    environment_id: NEWS_ENVIRONMENT_ID,
    collection_id: NEWS_COLLECTION_ID,
  });

  discovery.query(params, (error, response) => {
    if (error) {
      next(error);
    } else {
      // Aconsole.log( response )
      console.log('--------  QUERY');
      res.json(response);
    }
  });
});

app.post('/api/query2', (req, res, next) => {
  const params = Object.assign({}, req.body, {
    environment_id: NEWS_ENVIRONMENT_ID,
    collection_id: NEWS_COLLECTION_ID,
  });
  console.log('PARAMS', params);

  discovery.query(params, (error, response) => {
    if (error) {
      next(error);
    } else {
      res.json(response);
    }
  });
});

// error-handler settings for all other routes
require('./config/error-handler')(app);

module.exports = app;
