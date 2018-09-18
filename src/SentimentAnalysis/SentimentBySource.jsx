import React, {Component} from 'react';
import { string, shape, arrayOf } from 'prop-types';
import SentimentChart from './SentimentChart';
import { Accordion, Icon } from 'semantic-ui-react'
import SubStory from './SubStory';
import moment from 'moment';

const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';

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

//function SentimentBySource({ sentiments })  {
class SentimentBySource extends Component {

  constructor(props) {
	super(props)
  
	this.state = { 
		  activeIndex: -1,
		  data: null,
	}

	this.getLinks = this.getLinks.bind(this)
  }


  getLinks = (p) => {
        console.log( "getLinks", p )
		console.log( this.props  )
        this.setState({ query, loading: true, error: null, data: null });
		const f0 = "crawl_date>" + moment(this.props.query.date.from).format(ISO_8601) +
               ",crawl_date<" + moment(this.props.query.date.to).format(ISO_8601);
		const f1 = "host::\"" + p + "\""
        const query = { 
				query: this.props.query.text,
                filter: f0 + "," + f1,
                count: 3,
        }

		const host = process.env.REACT_APP_SERVER || '';
		fetch(`${host}/api/query2`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(query),
		})
		.then((response) => {
          //console.log( response )
			if (response.ok) {
				response.json().then((json) => {
                  console.log(json)
				this.setState({ loading: false, data: parseQueryResults(json) });
				});
			} else {
				response.json()
				.then((error) => {
					this.setState({ error, loading: false });
				})
				.catch(() => {
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

  handleClick = (e, titleProps) => {
    const { index } = titleProps
	console.log( "CLICK", index )
	const { activeIndex } = this.state
	const newIndex = activeIndex === index ? -1 : index
	this.setState({ activeIndex: newIndex })
	this.getLinks(this.props.sentiments[index].key)
  }

  render() {
    const { activeIndex } = this.state

  return (
    <div className="sentiment--sources-section">
      <div className="sentiment--sources">
        <div className="sentiment--sources-table">
          {
            this.props.sentiments.map((source, idx) =>
              (<div key={source.key} className="sentiment--source">
                <div
                  className="sentiment--source-cell sentiment--source-name"
                >
				  <Accordion>
				    <Accordion.Title active={activeIndex == idx} index={idx} onClick={this.handleClick}>
					  <Icon name='dropdown' />
					  { source.key }
					</Accordion.Title>
					<Accordion.Content active={activeIndex === idx}>
					  <div className="row">
                      <div className="second-stories--panel">
                      {
                        this.state.data
                        ?
                        (
                          this.state.data.results.map(item =>
                          (<SubStory
                            key={item.id}
                            title={item.title}
                            url={item.url}
                            host={item.host}
                            date={item.crawl_date}
							label={item.enriched_text.sentiment.document.label}
                            score={item.enriched_text.sentiment.document.score}
                          />))
                        )
                        :
                        (
                        <div></div>
                        )
                      }
                      </div>
                      </div>
					</Accordion.Content>
				  </Accordion>
                </div>
                <div
                  className="sentiment--source-cell sentiment--source-summary"
                >
                  { source.aggregations[0].results[0].key }
                </div>
                <div
                  className="sentiment--source-cell sentiment--source-chart"
                >
                  <SentimentChart sentiment={source.aggregations[0]} />
                </div>
              </div>),
            )
          }
        </div>
      </div>
    </div>
  );
}
}


SentimentBySource.propTypes = {
  sentiments: arrayOf(shape({
    key: string.isRequired,
    aggregations: arrayOf(shape({
      results: arrayOf(shape({
        key: string.isRequired,
      })).isRequired,
    })).isRequired,
  })).isRequired,
};

export default SentimentBySource;
