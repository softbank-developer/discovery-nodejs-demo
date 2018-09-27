import React, { Component } from 'react';
import { string, number, shape, arrayOf } from 'prop-types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import moment from 'moment';
import WidgetHeader from '../WidgetHeader/index';
import QuerySyntax from '../QuerySyntax/index';
import queryBuilder from '../query-builder';
import Accordion from '../Accordion/index';
import NoContent from '../NoContent/index';
import { getNames, getItemsForName } from './mentionsParser';
import capitalize from './capitalize';
import SubStory from './SubStory';

function date_format(p) {
  return ( p.substr(0, 4) + "-" + p.substr(4,2) + "-" + p.substr(6,2) + "T00:00:00Z" )
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


export default class MentionsAndSentiments extends Component {
  static propTypes = {
    mentions: shape({
      aggregations: arrayOf(shape({
        results: arrayOf(shape({
          key: string.isRequired,
          matching_results: number.isRequired,
          aggregations: arrayOf(shape({
            results: arrayOf(shape({
              key: number.isRequired,
              key_as_string: string.isRequired,
              matching_results: number.isRequired,
              aggregations: arrayOf(shape({
                type: string.isRequired,
                field: string.isRequired,
                results: arrayOf(shape({
                  key: string.isRequired,
                  matching_results: number.isRequired,
                })).isRequired,
              })).isRequired,
            })).isRequired,
          })).isRequired,
        })).isRequired,
      })).isRequired,
    }).isRequired,
    query: shape({
      text: string.isRequired,
    }).isRequired,
  }


  static calculateMentionCount(data) {
    return data.reduce((acc, item) => acc + item.positive + item.neutral + item.negative, 0);
  }

  static widgetTitle() {
    return 'Co-Mentions & Trends';
  }

  static widgetDescription() {
    return 'Discovery can identify frequently co-mentioned entities and follow trends in sentiment.';
  }


  constructor(props) {
    super(props);
    this.state = {
      showQuery: false,
      mentions: [],
      data: [null, null, null, null],
    };
    this.getLinks = this.getLinks.bind(this);
  }

  getInitialState() {
    // インスタンス作成のたびに呼ばれる
    return { temp: 'EMPTY' };
  }

  componentDidMount() {
    // 描画が成功して、DOMにアクセス可能になる
    this.setState({ mentions: this.getData() })
  }

  onShowQuery = () => {
    this.setState({ showQuery: true });
  }

  onShowResults = () => {
    this.setState({ showQuery: false });
  }

  getLinks(index, name) {
    const item_name = name;
    let tmp_data = this.state.data;
    tmp_data[index] = null;
    this.setState({ loading: true, error: null, data: tmp_data });
    const f0 = 'crawl_date>' + date_format(this.props.query.date.from) +
               ',crawl_date<' + date_format(this.props.query.date.to);
    const f1 = 'enriched_title.entities.text::"' + item_name + '"';
    const f2 = 'enriched_title.entities.type::Organization';
    const query = {
      query: this.props.query.text,
      filter: f0 + ',' + f1 + ',' + f2,
      sort: 'crawl_date',
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
          tmp_data[index] = parseQueryResults(json);
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


  getData() {
    const { mentions, query } = this.props;

    let mentionsData = getNames(mentions.aggregations[0].results)
      .filter(name => !(new RegExp(query.text, 'gi').test(name))) // filter out a mention that matches the query text input
      // .filter(name => /^[A-Z]/.test(name)) // check if name is capitalized (to ensure a brand is used)
      .map((name, i) => ({
        name,
        toggle: i === 0,
        data: getItemsForName(mentions.aggregations[0].results, name).results
          .filter((v, j) => j > 0)
          .map(item => ({
            date: moment(item[0]).format('MM/DD'),
            positive: item[1],
            negative: item[2],
            neutral: item[3],
          })),
      }));

    mentionsData = mentionsData.map((mention) => Object.assign({}, mention, {
      totalMentions: MentionsAndSentiments.calculateMentionCount(mention.data),
    })).sort((a, b) => b.totalMentions - a.totalMentions).filter((name, i) => { return i < 4; });

    // this.getLinks( mentionsData[0].name )
    // calculate sentiments
    mentionsData = mentionsData.map((item) => {
      // sum up all the negatives, positives, and neutrals
      let newItem;
      const sentimentSums = item.data.reduce(
        (prev, cur) => ({
          negative: prev.negative + cur.negative,
          neutral: prev.neutral + cur.neutral,
          positive: prev.positive + cur.positive,
        }), { negative: 0, neutral: 0, positive: 0 });
      // return neutral if negatives = positives
      if (sentimentSums.negative === sentimentSums.positive) {
        newItem = Object.assign({}, item, {
          sentiment: 'neutral',
        });
      } else { // else return largest sentiment
        const sentimentKeys = Object.keys(sentimentSums);
        const sentiment = sentimentKeys
          .reduce((prev, cur) => (sentimentSums[prev] > sentimentSums[cur] ? prev : cur));
        newItem = Object.assign({}, item, { sentiment });
      }
      return newItem;
    });

    if (mentionsData.length > 0) {
      this.getLinks(0, mentionsData[0].name);
    }
    return mentionsData;
  }

  toggleContent(index) {
    const mentions = this.state.mentions;
    this.getLinks(index, mentions[index].name);
    mentions[index].toggle = !mentions[index].toggle;
    this.setState({ mentions });
    // this.getLinks(this.state.mentions[0].name)
  }

  render() {
    const { query, mentions } = this.props;

    return (
      <div>
        {
          !this.state.showQuery
            ? (
              <div className="mentions-sentiments widget">
                <WidgetHeader
                  title={MentionsAndSentiments.widgetTitle()}
                  description={MentionsAndSentiments.widgetDescription()}
                  onShowQuery={this.onShowQuery}
                />
                <div className="accordions--wrapper">
                  {
                    this.state.mentions.length > 0
                      ? (
                        <div>
                          <div className="mentions-sentiments--header-row">
                            <div className="mentions-sentiments--header-row-name">
                              Topic
                            </div>
                            <div className="mentions-sentiments--header-row-mentions">
                              Number of Mentions
                            </div>
                            <div className="mentions-sentiments--header-row-sentiment">
                              Sentiment
                            </div>
                          </div>
                          <div className="accordions">
                            {
                              this.state.mentions.map((item, index) =>
                                (<Accordion
                                  key={item.name}
                                  show={item.toggle}
                                  onClickToggle={() => this.toggleContent(index)}
                                  footer={
                                    <div className="row">
                                      <div className="second-stories--panel">
                                        {
                                          this.state.data[index]
                                            ?
                                            (
                                              this.state.data[index].results.map(item2 =>
                                                (<SubStory
                                                  key={item2.id}
                                                  title={item2.title}
                                                  url={item2.url}
                                                  host={item2.host}
                                                  date={item2.crawl_date}
                                                  label={item2.enriched_text.sentiment.document.label}
                                                  score={item2.enriched_text.sentiment.document.score}
                                                />))
                                            )
                                            :
                                            (
                                              <div>.
                                              </div>
                                            )
                                        }
                                      </div>
                                    </div>
                                  }
                                  header={
                                    <div className="mentions-sentiments--data-row">
                                      <div className="mentions-sentiments--data-name">
                                        { `${capitalize(query.text)} + ${item.name}` }
                                      </div>
                                      <div className="mentions-sentiments--data-mentions">
                                        { item.totalMentions }
                                      </div>
                                      <div className="mentions-sentiments--data-sentiment">
                                        { capitalize(item.sentiment) }
                                      </div>
                                    </div>
                                  }
                                  content={(
                                    <ResponsiveContainer
                                      width={'100%'}
                                      height={250}
                                    >
                                      <LineChart
                                        data={item.data}
                                        margin={{
                                          top: 40,
                                          right: 30,
                                          bottom: 0,
                                          left: -20,
                                        }}
                                      >
                                        <Line
                                          type="linear"
                                          dataKey="positive"
                                          name="Positive Sentiment"
                                          stroke="#00a78f"
                                          strokeWidth="3"
                                          dot={{
                                            stroke: '#40d5bb',
                                            strokeWidth: 2,
                                            r: 4,
                                          }}
                                          activeDot={{
                                            strokeWidth: 2,
                                            r: 4,
                                            fill: '#40d5bb',
                                          }}
                                        />
                                        <Line
                                          type="linear"
                                          dataKey="negative"
                                          name="Negative Sentiment"
                                          stroke="#dc267f"
                                          strokeWidth="3"
                                          strokeDasharray="6, 8"
                                          dot={{
                                            stroke: '#ff509e',
                                            strokeDasharray: '0',
                                            strokeWidth: 2,
                                            r: 4,
                                          }}
                                          activeDot={{
                                            strokeWidth: 2,
                                            r: 4,
                                            fill: '#ff509e',
                                          }}
                                        />
                                        <CartesianGrid stroke="#ccc" />
                                        <XAxis
                                          dataKey="date"
                                          tickLine={false}
                                        />
                                        <YAxis
                                          padding={{ top: 10 }}
                                          label="&nbsp;&#x23; of articles"
                                          allowDecimals={false}
                                          tickLine={false}
                                        />
                                        <Legend
                                          align="left"
                                          iconSize={20}
                                        />
                                        <Tooltip />
                                      </LineChart>

                                    </ResponsiveContainer>
                                  )}
                                />),
                              )
                            }
                          </div>
                        </div>
                      )
                      : (
                        <NoContent
                          query={query}
                          message={'There are no analytics available for your query.'}
                        />
                      )
                  }
                </div>
              </div>
            )
            : (
              <QuerySyntax
                title={MentionsAndSentiments.widgetTitle()}
                query={queryBuilder.build(query, queryBuilder.widgetQueries.mentionsAndSentiments)}
                response={{ mentions }}
                onGoBack={this.onShowResults}
              />
            )
        }
      </div>
    );
  }
}
