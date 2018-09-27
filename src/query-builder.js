// const moment = require('moment');
const { fields } = require('./fields');
const TopStoriesQuery = require('./TopStories/query');
const TopEntitiesQuery = require('./TopEntities/query');
const SentimentAnalysisQuery = require('./SentimentAnalysis/query');
const MentionsAndSentimentsQuery = require('./MentionsAndSentiments/query');
const AnomalyDetectionQuery = require('./AnomalyDetection/query');

// ISO 8601 date format accepted by the service
// const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';

function date_format(p) {
  return ( p.substr(0, 4) + "-" + p.substr(4,2) + "-" + p.substr(6,2) + "T00:00:00Z" );
}

module.exports = {
  widgetQueries: {
    topStories: TopStoriesQuery,
    topEntities: TopEntitiesQuery,
    sentimentAnalysis: SentimentAnalysisQuery,
    mentionsAndSentiments: MentionsAndSentimentsQuery,
    anomalyDetection: AnomalyDetectionQuery,
  },
  build(query, widgetQuery) {
    // console.log( "### QUERY BUILDER BUILD", query, widgetQuery )
    const params = {
      query: `"${query.text}"`,
    };
    // params.filter = `${fields.language}:(english|en)`;

    // `${fields.publication_date}>${moment(query.date.from).add('hours',-12).format(ISO_8601)}`,
    if (query.date) {
      params.filter = [
        `${fields.publication_date}>${date_format(query.date.from)}`,
        `${fields.publication_date}<${date_format(query.date.to)}`,
      ].join(',');
    }
    // console.log( "PARAMS FILTER", params.filter )
    if (widgetQuery) {
      return Object.assign({}, params, widgetQuery);
    }

    // do a full query
    const allWidgetAggregations = [].concat(
      TopEntitiesQuery.aggregations,
      SentimentAnalysisQuery.aggregations,
      MentionsAndSentimentsQuery.aggregations,
      // eslint-disable-next-line comma-dangle
      AnomalyDetectionQuery.aggregations
    );
    params.aggregation = `[${allWidgetAggregations.join(',')}]`;
    // add in TopStoriesQuery since it is the only one without aggregations
    return Object.assign({}, params, TopStoriesQuery);
  },
};
