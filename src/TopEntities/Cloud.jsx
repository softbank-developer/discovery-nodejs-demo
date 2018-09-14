import React from 'react';
import { string, number, shape, arrayOf } from 'prop-types';
import { Icon, Label, Menu } from 'semantic-ui-react'


function Cloud({ data, maxSize, minSize, onShowLinks, CType }) {
  const largest = data
    ? data.reduce((prev, cur) => (cur.matching_results > prev
      ? cur.matching_results
      : prev), 0)
    : 0;
  const ratio = maxSize / largest;
  const computeSize = value => Math.max(minSize, value * ratio);
  //<button className="base--button widget--header-button" onClick={() => onShowLinks(CType,`${item.key}`)} > {item.key} </button>
  //			  <Label color='teal' floating>{item.matching_results}</Label>

  return (
    <div className="top-entities--cloud" style={{ lineHeight: "20px", }}>
      {
        data
          ? data.map(item =>
            (
              <div
                className="top-entities--word"
                key={`${item.key}`}
                title={item.matching_results}
                style={{
                  fontSize: "18px",
                }}
              >
			  <Menu>
			    <Menu.Item as='a'
			      onClick={() => onShowLinks(CType,`${item.key}`)}
				>
					{item.key}
				  <Label circular color='teal' key='teal'>{item.matching_results}</Label>
				</Menu.Item>
			  </Menu>
              </div>
            ),
          )
          : []
      }
    </div>
  );
}

Cloud.propTypes = {
  data: arrayOf(shape({
    key: string.isRequired,
    matching_results: number.isRequired,
  })).isRequired,
  maxSize: number,
  minSize: number,
};

Cloud.defaultProps = {
  maxSize: 28,
  minSize: 12,
};

export default Cloud;
