var parser = require('cron-parser');

const explode = (data, {
  start = new Date(),
  end = new Date(),
  field = 'cron',
  exclude = [],
  utc = false,
  sorted = false, // TODO: This doesn't do anything
}) => {

  // TODO: Use a reduce instead
  let output = [];
  // Allow users to pass in a single crontab, or an array of multiple cron tabs
  let events = [].concat(data);
  if(start.getTime() > end.getTime()){
    throw RangeError(`Start of datetime range cannot be later than end of datetime range`);
  }
  events.forEach((event) => {
    const options = {
      currentDate: start,
      endDate: end,
      utc,
    };
    if(!event.hasOwnProperty(field)){
      throw ReferenceError(`'${field}' field not present in data object.`);
    }
    let interval = parser.parseExpression(event[field], options);
    let current;

    // Using exceptions for desired behaviour is dumb as fuck, but
    // this is the preferred way of using cron-parser for some reason *shrug*
    while(true){
      try {
        current = interval.next()._date.toDate(); // cron parser returns a moment object
        if(skip(current, exclude)){ continue; }
        output.push({
          ...event,
          [field]: current.toISOString(),
        })

      } catch (err) {
        break;
      }
    }
  });

  return output;
}

const skip = (current, exclude) => {
  /*
    The the exclude param is an array of ISO date strings (e.g. '2020-01-03T00:10:00.000Z')
    not an array of JS Dates. This is because a DB will usually store dates like this.
  */
  return !!exclude.find(date => {return new Date(date).getTime() === current.getTime()});
}

const intersection = ({
  cron1,
  cron2,
  start = new Date(),
  end = new Date(),
}) => {

  const dates1 = explode({cron: cron1}, {start, end});
  const dates2 = explode({cron: cron2}, {start, end});
  const intersection = [];
  // TODO: This is n^2. Come up with a better way to do this.
  dates1.forEach((date1) => {
    dates2.forEach((date2) => {

      // Since this isn't a Set, it has the potential for duplicates
      if(new Date(date1.cron).getTime() === new Date(date2.cron).getTime()){ intersection.push(date1.cron); }
    })
  })

  return intersection;
}

module.exports.explode = explode;
module.exports.intersection = intersection;
