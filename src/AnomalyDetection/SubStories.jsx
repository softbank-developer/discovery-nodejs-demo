import React, {Component} from 'react';
import moment from 'moment';
import { string, number } from 'prop-types';

const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';

const parseQueryResults = (data) => {
  var res = [];
  data.results.map( ( result, idx ) => {
	const parsedData = {
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
        const f0 = "crawl_date>" + moment(p).add('days', -1).format(ISO_8601) +
               ",crawl_date<" + moment(p).add('days', 1).format(ISO_8601);
        const query = { 
                query: p_query.text,
                filter: f0,
				sort: "crawl_date",
                count: 3,
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
	data.sort( ( a, b ) => {
		return a.key - b.key
	})
    .map( (item,idx) => {
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
	//{ url:url, date:"", title:"hello", host:"yahoo", label:"", score:"" },
	//{ url:url, date:"", title:"world", host:"google", label:"", score:"" }
  }

  //anomalyData.map( (item,idx) => {
//	console.log(item)
 // })

  //const [ anomas ] = ff(data)
		//
  render() {
    //const { data } = this.state
	const query = this.props.query
    return (
        <div className="substory">
		{
		  this.state.data.map(item1 =>
		  {
			return (
			  <div>
			  { item1.index_date }
			  {
			  item1.map( item =>
		      {
			    return (
		          <div>
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
  date: string.isRequired,
  host: string,
  score: number.isRequired,
  title: string.isRequired,
  url: string.isRequired,
};

SubStories.defaultProps = {
  host: 'Placeholder Source',
};

export default SubStories;
