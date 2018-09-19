import React, {Component} from 'react';
import moment from 'moment';
import { string, number } from 'prop-types';
import { Accordion, Icon } from 'semantic-ui-react'

const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';

const parseQueryResults = (data) => {
  var res = [];
  data.results.map( ( result, idx ) => {
	const parsedData = {
		id: result.id,
		title: result.title,
		url: result.url,
		host: result.host,
		date: result.crawl_date,
	};
	res.push( parsedData )
  });
  return res;
};

class SubStories extends Component {
//({ data, query }) {

  constructor(props) {
    super(props)
  
    this.state = { 
		activeIndex: -1,
        data: [],
    }   

    this.getLinks = this.getLinks.bind(this)
    this.iter_slice = this.iter_slice.bind(this)
  }

	componentDidMount() {
		this.iter_slice(this.props.data, this.props.query)
		//this.setState( { mentions: this.getData() } )
	}

  getLinks = (p,p_query) => {
        console.log( "Anomary SubStories getLinks", p )
		console.log( moment(p) )
		console.log(p_query)
        //const f0 = "crawl_date>" + moment(p).add('days', 0).add('hours',-4).format(ISO_8601) +
        //       ",crawl_date<" + moment(p).add('days', 1).add('hours', 11).format(ISO_8601);
        const f0 = "crawl_date>" + moment(p).add('days', 0).hours(12).minutes(0).seconds(0).millisecond(0).format(ISO_8601) +
               ",crawl_date<" + moment(p).add('days', 1).hours(12).minutes(0).seconds(0).millisecond(0).format(ISO_8601);
        const query = { 
                query: p_query.text,
                filter: f0,
				sort: "crawl_date",
                count: 5,
        }       
		console.log( ">>", query )
        
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
				  console.log( "ANOMALY", json)
				  var tmp_data = this.state.data
				  var res_json = parseQueryResults(json)
				  res_json["index_date"] = moment(p).format(ISO_8601)
				  tmp_data.push( res_json )
				  this.setState({ loading: false, data: tmp_data });
				  return 
                });
            } else {
                response.json()
                .then((error) => {
                    //this.setState({ error, loading: false });
                })  
                .catch(() => {
                    //this.setState({ error: { error: 'There was a problem with the request, please try again', }, loading: false, }); 
                }); 
            }   
    });     
  } 

  iter_slice = (data, query) => {
	console.log( 'FF -----------' )
	console.log( query )
    this.setState({ query, loading: true, error: null, data: [] });
	var res = []
	var data2 = data.sort( ( a, b ) => {
		if ( a.key < b.key ) {
		  return -1
		}
		if ( a.key > b.key ) {
		  return 1
		}
		return 0
	})
	console.log( data2 )
    data2.map( (item,idx) => {
      if ( item.anomaly ) {
		var xrange = item.key_as_string.substring(0,10)
		var xrange = item.key

	    console.log( "########" )
		console.log( item )
	    console.log( idx, xrange)
		this.getLinks( xrange, query )
		//res.push( { url: "A", date:item.key_as_string, title: xrange, host: "C", label: "D", score: 1.0 } )
	  }
	})
	return
  }


  handleClick = (e, titleProps) => {
    const { index } = titleProps
    console.log( "CLICK", index )
    const { activeIndex } = this.state
    const newIndex = activeIndex === index ? -1 : index
    this.setState({ activeIndex: newIndex })
  }
		
  render() {
    //const { data } = this.state
	const { activeIndex } = this.state
	const query = this.props.query
    return (
        <div className="substory">
		{
		  this.state.data.sort( (x,y) => {
		    if ( x.index_date < y.index_date ) {
				return -1
			}
		    if ( x.index_date > y.index_date ) {
				return 1
			}
			return 0
		  })
		  .map( (item1,idx1) =>
		  {
			return (
			  <div key={item1.index_date}>
			  <Accordion>
			  <Accordion.Title active={activeIndex == idx1} index={idx1} onClick={this.handleClick}>
			  <Icon name='dropdown' />
			  { item1.index_date.substring(0,10) }
			  </Accordion.Title>
			  <Accordion.Content active={activeIndex === idx1}>
			  {
			    item1.sort( (a,b) => {
				  if ( moment(a.date).isBefore(b.date) ) {
				  return 1
				  }
				  if ( moment(a.date).isAfter(b.date) ) {
				  return -1
				  }
				  return 0
			    })
			    .map( item => {
			    return (
		          <div key={item.id}>
                    <div className="story--source-and-score">
                      <span className="story--date"> { moment(item.date).format('M/D/YYYY hh:MMa') } </span>
			          <span className="story--source-score-divider"> | </span>
                      <span className="base--p story--source"> { item.host } </span>
                    </div>
                    <a className="substory--title base--a results--a" href={item.url} target="_blank" title={item.title} rel="noopener noreferrer" >
                    {item.title} </a>
		          </div>
		        )
			  }
			  )
			}
			</Accordion.Content>
			</Accordion>
			</div>
			)
		  }
		  )
		}
	    </div>
  );
}
}

SubStories.propTypes = {
  host: string,
};

SubStories.defaultProps = {
  host: 'Placeholder Source',
};

export default SubStories;
