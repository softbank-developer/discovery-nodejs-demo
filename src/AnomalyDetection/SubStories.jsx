import React from 'react';
import moment from 'moment';
import { string, number } from 'prop-types';

const ISO_8601 = 'YYYY-MM-DDThh:mm:ssZZ';

function SubStories({ data, query }) {

  const getLinks = (p,p_query) => {
        console.log( "SubStories getLinks", p )
		console.log( moment(p) )
		console.log(p_query.text)
        //this.setState({ query, loading: true, error: null, data: null });
        const f0 = "crawl_date>" + moment(p).add('days', -1).format(ISO_8601) +
               ",crawl_date<" + moment(p).format(ISO_8601);
        const query = { 
                query: p_query.text,
                filter: f0,
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
                //this.setState({ loading: false, data: parseQueryResults(json) });
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

  const ff = (data, query) => {
	var res = []
	data.map( (item,idx) => {
      if ( item.anomaly ) {
		var xrange = item.key_as_string.substring(0,10)
	    console.log(item.key_as_string)

		getLinks( xrange, query  )
		res.push( { url: "A", date:item.key_as_string, title: xrange, host: "C", label: "D", score: 1.0 } )
	  }
	})
	return res
	//{ url:url, date:"", title:"hello", host:"yahoo", label:"", score:"" },
	//{ url:url, date:"", title:"world", host:"google", label:"", score:"" }
  }

  //anomalyData.map( (item,idx) => {
//	console.log(item)
 // })

  //const [ anomas ] = ff(data)
  var anomas = ff(data, query)
  console.log( anomas )
  return (
        <div className="substory">
		{
		  anomas.map( item =>
		  (
		  <div>
          <div className="story--source-and-score">
            <span className="base--p story--source">
              { item.host }
            </span>
            <span className="story--source-score-divider"> | </span>
            <span className="story--score base--p">
		      <span>Label: { item.label }</span>
            </span>
            <span className="story--source-score-divider"> | </span>
            <span className="story--score base--p">
              <span>Score: { item.score }</span>
            </span>
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
          <div className="story--date">
            { moment(item.date).format('M/D/YYYY hh:MMa') }
          </div>
		  </div>
	      ))
		}
	    </div>
  );
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
