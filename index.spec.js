const cronBomb = require('./index');

describe('explode()', () => {
  it("matches output", () => {

    const start = new Date(Date.UTC(2020, 0, 1, 0, 0));
    const end = new Date(Date.UTC(2020, 0, 8, 0, 0));
    const data = {
      title: 'Lord Of The Fries',
      cron: '10 0 * * 1-5', // Every weekday at 11am
    };
    const expected = [
      {
        "title": "Lord Of The Fries",
        "cron": "2020-01-01T00:00:00.000Z"
      },
      {
        "title": "Lord Of The Fries",
        "cron": "2020-01-01T00:00:00.000Z"
      },
      {
        "title": "Lord Of The Fries",
        "cron": "2020-01-01T00:00:00.000Z"
      },
      {
        "title": "Lord Of The Fries",
        "cron": "2020-01-01T00:00:00.000Z"
      },
      {
        "title": "Lord Of The Fries",
        "cron": "2020-01-01T00:00:00.000Z"
      }
    ]
    expect(cronBomb.explode({data, start, end})).toEqual(expected);
  });

  it("fails if the data object doesn't have a 'cron' field", () => {
    const data = {
      'crontypo': '1 1 * * 0',
    }
    expect(() => {
      cronBomb.explode({data});
    }).toThrow(ReferenceError);

  });

  it("fails if the the cron field isn't valid cron syntax", () => {

  });

  it("checks the correct field if $field is passed in", () => {

  });

  it('fails if start is later than end', () => {

  });

  it('removes excluded dates from the returned array', () => {

  });

  it('accepts data as a single object', () => {

  });

  it('accepts data as an array of objects', () => {

  });
});
