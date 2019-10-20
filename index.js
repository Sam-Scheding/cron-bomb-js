var parser = require('cron-parser');

const explode = ({
  source = {},
  start = new Date(),
  end = new Date(),
  field = 'cron',
  exclude = [],
}) => {

  let output = [];
  let interval = parser.parseExpression(source[field]);
  let occurance = interval.next();

  while(occurance._date <= end){
    occurance = interval.next();
    if(exclude.includes(occurance)){ continue; } // TODO: also remove the element from excludes
    output.push({
      ...source,
      [field]: occurance,
    })
  }
  return output;
}

const intersection = ({
  cron1,
  cron2,
  start = new Date(),
  end = new Date(),
}) => {

  const set1 = new Set(explode({{cron: cron1}, start, end}));
  const set2 = new Set(explode({{cron: cron2}, start, end}));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection;
}


module.exports.explode = explode;
module.exports.intersection = intersection;
