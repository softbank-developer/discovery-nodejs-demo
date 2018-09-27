import React, { Component } from 'react';
import { string, number, shape, arrayOf } from 'prop-types';
import { Tabs, Pane } from 'watson-react-components';
import WidgetHeader from '../WidgetHeader/index';
import Cloud from './Cloud';
import SubStory from './SubStory';
import QuerySyntax from '../QuerySyntax/index';
import queryBuilder from '../query-builder';
import NoContent from '../NoContent/index';
// import moment from 'moment';

// const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';
function date_format(p) {
  return ( p.substr(0, 4) + "-" + p.substr(4,2) + "-" + p.substr(6,2) + "T00:00:00Z" );
}

const parseQueryResults = (data) => {
  const parsedData = {
    results: data.results, // Top Results
    entities: {}, // Topic cloud
    sentiments: null, // Sentiment by source
    entiment: null, // Overall sentiment
    entions: null, // Mentions and Sentiments
    nomalyData: null, // Anomaly data
  };
  return parsedData;
};

export default class TopEntities extends Component {
  static widgetTitle() {
    return 'Top Entities';
  }

  static widgetDescription() {
    return 'Discovery can easily extract frequently mentioned entities - such as people, topics and organizations - from the set of articles.';
  }

  static propTypes = {
    entities: shape({
      topics: arrayOf(shape({
        key: string.isRequired,
        matching_results: number.isRequired,
      })).isRequired,
      organizations: arrayOf(shape({
        key: string.isRequired,
        matching_results: number.isRequired,
      })).isRequired,
      people: arrayOf(shape({
        key: string.isRequired,
        matching_results: number.isRequired,
      })).isRequired,
    }).isRequired,
    query: shape({
      text: string.isRequired,
      date: shape({
        from: string.isRequired,
        to: string.isRequired,
      }),
    }).isRequired,
    // links: arrayOf(object).isRequired,
  }

  state = {
    query: null,
    error: null,
    data: [null, null, null],
    loading: false,
    showQuery: false,
  }

  onShowQuery = () => {
    this.setState({ showQuery: true });
  }

  onShowResults = () => {
    this.setState({ showQuery: false });
  }

  getLinks = (ctype, p) => {
    console.log('getLinks', ctype, p);
    let tmp_data = this.state.data;
    let query;
    let fs;
    let data_index;
    const f0 = 'crawl_date>' + date_format(this.props.query.date.from) +
           ',crawl_date<' + date_format(this.props.query.date.to);
    if (ctype === 'Topics') {
      const f1 = 'enriched_title.concepts.text::"' + p + '"'
      fs = f1 + ',' + f0;
      data_index = 0;
    }
    if (ctype === 'Organizations') {
      const f1 = 'enriched_title.entities.type::Organization';
      const f2 = 'enriched_title.entities.text::"' + p + '"';
      fs = f1 + ',' + f2 + ',' + f0;
      data_index = 1;
    }
    if (ctype === 'People') {
      const f1 = 'enriched_title.entities.type:Person';
      const f2 = 'enriched_title.entities.text::"' + p + '"'
      fs = f1 + ',' + f2 + ',' + f0;
      data_index = 2;
    }
    tmp_data[data_index] = null;
    this.setState({ query, loading: true, error: null, data: tmp_data });
    query = {
      query: this.props.query.text,
      filter: fs,
	  deduplicate: true,
      count: 3,
    };
    const host = process.env.REACT_APP_SERVER || '';
    fetch(`${host}/api/query2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    }).then((response) => {
      if (response.ok) {
        response.json().then((json) => {
          tmp_data[data_index] = parseQueryResults(json);
          // console.log( "RESPONSE", data_index, tmp_data[data_index] )
          this.setState({ loading: false, data: tmp_data });
        });
      } else {
        response.json().then((error) => {
          this.setState({ error, loading: false });
        }).catch(() => {
          this.setState({
            error: {
              error: 'There was a problem with the request, please try again',
            },
            loading: false,
          });
        });
      }
    });
  }


  getCompanies() {
    const { entities: { organizations }, query } = this.props;

    if (!organizations) {
      return [];
    }

    return organizations.filter(item => item.key.toLowerCase() !== query.text.toLowerCase());
  }

  render() {
    const { entities: { topics, organizations, people }, query } = this.props;

    return (
      <div>
        {
          !this.state.showQuery
            ? (
              <div className="top-entities widget">
                <WidgetHeader
                  title={TopEntities.widgetTitle()}
                  description={TopEntities.widgetDescription()}
                  onShowQuery={this.onShowQuery}
                />
                <Tabs selected={0}>
                  <Pane label="Topics">
                    {
                      topics.length > 0
                        ? (
                          <Cloud
                            data={topics}
                            onShowLinks={this.getLinks}
                            CType="Topics"
                          />
                        )
                        : (
                          <NoContent
                            query={query}
                            message={'No Topics found.'}
                          />
                        )
                    }
                    <div className="row">
                      <div className="second-stories--panel">
                        {
                          this.state.data[0]
                            ?
                            (
                              this.state.data[0].results.map(item =>
                                (<SubStory
                                  key={item.id}
                                  title={item.title}
                                  url={item.url}
                                  host={item.host}
                                  date={item.crawl_date}
                                  score={item.result_metadata.score}
                                />))
                            )
                            :
                            (
                              <div></div>
                            )
                        }
                      </div>
                    </div>
                  </Pane>
                  <Pane label="Organizations">
                    {
                      organizations.length > 0
                        ? (
                          <Cloud
                            data={this.getCompanies()}
                            onShowLinks={this.getLinks}
                            CType="Organizations"
                          />
                        )
                        : (
                          <NoContent
                            query={query}
                            message={'No Organizations found.'}
                          />
                        )
                    }
                    <div className="row">
                      <div className="second-stories--panel">
                        {
                          this.state.data[1]
                            ?
                            (
                              this.state.data[1].results.map(item =>
                                (<SubStory
                                  key={item.id}
                                  title={item.title}
                                  url={item.url}
                                  host={item.host}
                                  date={item.crawl_date}
                                  score={item.result_metadata.score}
                                />))
                            )
                            :
                            (
                              <div></div>
                            )
                        }
                      </div>
                    </div>
                  </Pane>
                  <Pane label="People">
                    {
                      people.length > 0
                        ? (
                          <Cloud
                            data={people}
                            onShowLinks={this.getLinks}
                            CType="People"
                          />
                        )
                        : (
                          <NoContent
                            query={query}
                            message={'No People found.'}
                          />
                        )
                    }
                    <div className="row">
                      <div className="second-stories--panel">
                        {
                          this.state.data[2]
                            ?
                            (
                              this.state.data[2].results.map(item =>
                                (<SubStory
                                  key={item.id}
                                  title={item.title}
                                  url={item.url}
                                  host={item.host}
                                  date={item.crawl_date}
                                  score={item.result_metadata.score}
                                />))
                            )
                            :
                            (
                              <div></div>
                            )
                        }
                      </div>
                    </div>
                  </Pane>
                </Tabs>
              </div>
            )
            : (
              <QuerySyntax
                title="Top Entities"
                query={queryBuilder.build(query, queryBuilder.widgetQueries.topEntities)}
                response={this.props.entities}
                onGoBack={this.onShowResults}
              />
            )

        }
      </div>
    );
  }
}
