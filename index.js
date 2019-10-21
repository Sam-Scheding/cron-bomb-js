var parser = require('cron-parser');

const explode = ({
  source = {},
  start = new Date(),
  end = new Date(),
  field = 'cron',
  exclude = [],
}) => {

  let output = [];
  let interval = parser.parseExpression(source[field], {currentDate: start});
  let occurance = interval.next();

  while(new Date(occurance._date.format()) <= end){
    if(exclude.includes(occurance)){ continue; } // TODO: also remove the element from excludes
    output.push({
      ...source,
      [field]: new Date(occurance._date.format()),
    })
    occurance = interval.next();
  }
  return output;
}

const intersection = ({
  cron1,
  cron2,
  start = new Date(),
  end = new Date(),
}) => {

  const dates1 = explode({source: {cron: cron1}, start, end});
  const dates2 = explode({source: {cron: cron2}, start, end});
  const intersection = [];

  // TODO: This is n^2. Come up with a better way to do this.
  dates1.forEach((date1) => {
    dates2.forEach((date2) => {
      if(date1.cron.getTime() === date2.cron.getTime()){ intersection.push(date1.cron); }
    })
  })

  return intersection;
}


module.exports.explode = explode;
module.exports.intersection = intersection;
