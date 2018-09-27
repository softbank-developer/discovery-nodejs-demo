import React from 'react';
import moment from 'moment';
import { string, number } from 'prop-types';

function SubStory({ date, host, score, title, label, url }) {
  return (
    <div className="substory">
      <div className="story--date">
        { moment(date).utc().format('M/D/YYYY hh:MMa') }
      </div>
      <a
        className="substory--title base--a results--a"
        href={url}
        target="_blank"
        title={title}
        rel="noopener noreferrer"
      >
        {title}
      </a>
      <div className="story--source-and-score">
        <span className="base--p story--source">
          { host }
        </span>
        <span className="story--source-score-divider"> | </span>
        <span className="story--score base--p">
          <span>Label: { label }</span>
        </span>
        <span className="story--source-score-divider"> | </span>
        <span className="story--score base--p">
          <span>Score: { score }</span>
        </span>
      </div>
    </div>
  );
}

SubStory.propTypes = {
  date: string.isRequired,
  host: string,
  score: number.isRequired,
  title: string.isRequired,
  url: string.isRequired,
};

SubStory.defaultProps = {
  host: 'Placeholder Source',
};

export default SubStory;
