var parser = require('cron-parser');

const explode = ({
  start = Date.now(),
  end = Date.now(),
  data = {},
  field = 'cron',
  exclude = [],
  sorted = false, // TODO: This doesn't do anything
}) => {

  // TODO: Use a reduce instead
  let output = [];
  // Allow users to pass in a single crontab, or an array of multiple cron tabs
  let crons = [].concat(data[field]);

  crons.forEach((cron) => {
    const options = {
      currentDate: start,
      endDate: end,
      utc: true,
    };
    let interval = parser.parseExpression(cron, options);
    let current;

    // Using exceptions for desired behaviour is dumb as fuck, but
    // this is the preferred way of using cron-parser for some reason *shrug*
    while(true){
      try {
        current = interval.next()._date;
        if(skip(current, exclude)){ continue; }
        output.push({
          ...data,
          [field]: current,
        })
      } catch (err) {
        break;
      }
    }
  });
  return output;
}

const skip = (current, exclude) => {
  exclude.forEach(date => {
    if(date.getTime() === current.toDate().getTime()){ return true; }
  });
  return false;
}

const intersection = ({
  cron1,
  cron2,
  start = new Date(),
  end = new Date(),
}) => {

  const dates1 = explode({data: {cron: cron1}, start, end});
  const dates2 = explode({data: {cron: cron2}, start, end});
  const intersection = [];

  // TODO: This is n^2. Come up with a better way to do this.
  dates1.forEach((date1) => {
    dates2.forEach((date2) => {

      // Since this isn't a Set, it has the potential for duplicates
      if(date1.cron.getTime() === date2.cron.getTime()){ intersection.push(date1.cron); }
    })
  })

  return intersection;
}

module.exports.explode = explode;
module.exports.intersection = intersection;
