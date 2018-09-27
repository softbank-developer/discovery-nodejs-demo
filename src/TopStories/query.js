const { fields } = require('../fields');

const returnFields = [
  fields.title,
  fields.url,
  fields.host,
  fields.publication_date,
  fields.score,
].join(',');

module.exports = {
  deduplicate: true,
  count: 5,
  return: returnFields,
};
