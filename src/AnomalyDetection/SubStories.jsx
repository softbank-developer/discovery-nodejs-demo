import React, { Component } from 'react';
import moment from 'moment';
import { string } from 'prop-types';
import { Accordion, Icon } from 'semantic-ui-react';

const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';

function dateFormat(p, v) {
  // var tmp = moment(p).add('days',v).format()
  if (v === 0) {
    return (p.substr(0, 4) + '-' + p.substr(5, 2) + '-' + p.substr(8, 2) + 'T00:00:00Z');
  }
  if (v === 1) {
    return (p.substr(0, 4) + '-' + p.substr(5, 2) + '-' + p.substr(8, 2) + 'T23:59:59Z');
  }
  return false;
}

const parseQueryResults = (data) => {
  const res = [];
  data.results.map((result) => {
    const parsedData = {
      id: result.id,
      title: result.title,
      url: result.url,
      host: result.host,
      date: result.crawl_date,
    };
    res.push(parsedData);
    return 1;
  });

  return res;
};

class SubStories extends Component {
  // ({ data, query }) {

  constructor(props) {
    super(props);

    this.state = {
      activeIndex: -1,
      data: [],
    };

    this.getLinks = this.getLinks.bind(this);
    this.iter_slice = this.iter_slice.bind(this);
  }

  componentDidMount() {
    this.iter_slice(this.props.data, this.props.query);
    // this.setState( { mentions: this.getData() } )
  }

  getLinks = (p, p_query) => {
    // console.log( "Anomary SubStories getLinks", p )
    // const f0 = "crawl_date>" + moment(p).add('days', 0).add('hours',-4).format(ISO_8601) +
    //       ",crawl_date<" + moment(p).add('days', 1).add('hours', 11).format(ISO_8601);
    const p1 = moment(p).format();
    const f0 = 'crawl_date>' + dateFormat(p1, 0) + ',crawl_date<' + dateFormat(p1, 1);
    // count: 10,
    const query = {
      query: p_query.text,
      filter: f0,
      deduplicate: true,
      count: 5,
    };

    const host = process.env.REACT_APP_SERVER || '';
    fetch(`${host}/api/query2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    }).then((response) => {
      // console.log( response )
      if (response.ok) {
        response.json().then((json) => {
          let tmp_data = this.state.data;
          let res_json = parseQueryResults(json);
          res_json.index_date = moment(p).format(ISO_8601);
          tmp_data.push(res_json);
          this.setState({ loading: false, data: tmp_data });
          return;
        });
      } else {
        response.json().then((error) => {
          // this.setState({ error, loading: false });
          console.log( error );
        }).catch(() => {
          // this.setState({ error: { error: 'There was a problem with the request, please try again', }, loading: false, });
          console.log( "ERROR" );
        });
      }
    });
  }

  iter_slice = (data, query) => {
    this.setState({ query, loading: true, error: null, data: [] });
    const data2 = data.sort((a, b) => {
      if (a.key < b.key) {
        return -1;
      }
      if (a.key > b.key) {
        return 1;
      }
      return 0;
    });
    data2.map((item) => {
      if (item.anomaly) {
        const xrange = item.key;
        this.getLinks(xrange, query);
        // res.push( { url: "A", date:item.key_as_string, title: xrange, host: "C", label: "D", score: 1.0 } )
      }
      return 1;
    });
    return 0;
  }

  handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index
      ? -1
      : index;
    this.setState({ activeIndex: newIndex });
  }

  render() {
    // const { data } = this.state
    const { activeIndex } = this.state;
    return (
      <div className="substory">
        {
          this.state.data.sort((x, y) => {
            if (x.index_date < y.index_date) return -1;
            if (x.index_date > y.index_date) return 1;
            return 0;
          }).map((item1, idx1) => {
            return (
              <div key={item1.index_date}>
                <Accordion>
                  <Accordion.Title
                    active={activeIndex === idx1}
                    index={idx1}
                    onClick={this.handleClick}
                  >
                    <Icon name="dropdown" />
                    { item1.index_date.substring(0, 10) }
                  </Accordion.Title>
                  <Accordion.Content
                    active={activeIndex === idx1}
                  >
                    {
                      item1.sort((a, b) => {
                        if (a.date < b.date) return -1;
                        if (a.date > b.date) return 1;
                        return 0;
                      }).map((item) => {
                        return (
                          <div key={item.id}>
                            <div className="story--source-and-score">
                              <span className="story--date">
                                { moment(item.date).utc().format('M/D/YYYY hh:MMa') }
                              </span>
                              <span className="story--source-score-divider"> | </span>
                              <span className="base--p story--source"> {item.host} </span>
                            </div>
                            <a
                              className="substory--title base--a results--a"
                              href={item.url}
                              target="_blank"
                              title={item.title}
                              rel="noopener noreferrer"
                            >
                              {item.title}
                            </a>
                          </div>
                        );
                      })
                    }
                  </Accordion.Content>
                </Accordion>
              </div>
            );
          })
        }
      </div>
    ); // end of return
  } // end of render
} // end of class

SubStories.propTypes = {
  host: string,
};

SubStories.defaultProps = {
  host: 'Placeholder Source',
};

export default SubStories;
