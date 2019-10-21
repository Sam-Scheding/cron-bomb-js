var parser = require('cron-parser');

const explode = ({
  start = Date.now(),
  end = Date.now(),
  source = {},
  field = 'cron',
  exclude = [],
}) => {

  // TODO: Use a reducer instead
  let output = [];
  let interval = parser.parseExpression(source[field], {currentDate: start});

  let d = interval.next();
  let instance = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDay(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));

  while(instance <= end){
    let skip = false;
    exclude.forEach(date => {
      if(date.getTime() === instance.getTime()){ skip = true; }
    });
    if(skip){ continue; }

    output.push({
      ...source,
      [field]: instance,
    })
    d = interval.next();
    instance = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDay(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));

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
