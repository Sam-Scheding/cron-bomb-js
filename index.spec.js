const cronBomb = require('./index');

describe('explode()', () => {
  it("accepts data as a single object", () => {

    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const data = {
      title: 'Lord Of The Fries',
      cron: '10 0 * * 1-5', // Every weekday at 11am
    };
    const expected =    [
      { title: 'Lord Of The Fries', cron: '2020-01-01T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-02T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-03T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-06T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-07T00:10:00.000Z' }
    ];
    const received = cronBomb.explode({data, start, end, utc:true});
    expect(received).toEqual(expected);
  });

  it('accepts data as an array of objects', () => {
    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const data = [
      {
        title: 'Lord Of The Fries',
        cron: '10 0 * * 1-5', // Every weekday at 11am
      },
      {
        title: 'Shift Eatery',
        cron: '10 0 * * 1-5', // Every weekday at 11am
      },
    ];
    const expected =    [
      { title: 'Lord Of The Fries', cron: '2020-01-01T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-02T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-03T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-06T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-07T00:10:00.000Z' },
      { title: 'Shift Eatery', cron: '2020-01-01T00:10:00.000Z' },
      { title: 'Shift Eatery', cron: '2020-01-02T00:10:00.000Z' },
      { title: 'Shift Eatery', cron: '2020-01-03T00:10:00.000Z' },
      { title: 'Shift Eatery', cron: '2020-01-06T00:10:00.000Z' },
      { title: 'Shift Eatery', cron: '2020-01-07T00:10:00.000Z' }
    ];
    const received = cronBomb.explode({data, start, end, utc:true});
    expect(received).toEqual(expected);
  });

  it("fails if the data object doesn't have a 'cron' field", () => {
    const data = {
      'nocronfield': '1 1 * * 0',
    }
    expect(() => {
      cronBomb.explode({data});
    }).toThrow(ReferenceError);

  });

  it("fails if the the cron field isn't valid cron syntax", () => {

    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const data = {
      title: 'Lord Of The Fries',
      cron: '8', // crontabs expect the first entry to be a number from 0-7
    };

    // Technically, this should throw a RangeError, but the error is thrown by
    // the cronparser library, not cronbomb, so I don't have much control over
    // it.
    expect(() => {
      cronBomb.explode({start, end, data});
    }).toThrow(Error);

  });

  it("checks the correct field if $field is passed in", () => {
    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const field = 'blah';
    const data = {
      title: 'Lord Of The Fries',
      [field]: '10 0 * * 1-5', // Every weekday at 11am
    };

    const expected =    [
      { title: 'Lord Of The Fries', [field]: '2020-01-01T00:10:00.000Z' },
      { title: 'Lord Of The Fries', [field]: '2020-01-02T00:10:00.000Z' },
      { title: 'Lord Of The Fries', [field]: '2020-01-03T00:10:00.000Z' },
      { title: 'Lord Of The Fries', [field]: '2020-01-06T00:10:00.000Z' },
      { title: 'Lord Of The Fries', [field]: '2020-01-07T00:10:00.000Z' }
    ];
    const received = cronBomb.explode({data, start, end, field, utc:true});
    expect(received).toEqual(expected);
  });

  it('fails if start is later than end', () => {
    const start = new Date('08 January 2020 00:00 UTC');
    const end = new Date('01 January 2020 00:00 UTC');
    const data = {
      title: 'Lord Of The Fries',
      cron: '10 0 * * 1-5', // Every weekday at 11am
    };

    expect(() => {
      cronBomb.explode({start, end, data});
    }).toThrow(RangeError);
  });

  it('removes excluded dates from the returned array', () => {

    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const data = {
      title: 'Lord Of The Fries',
      cron: '10 0 * * 1-5', // Every weekday at 11am
    };
    const exclude = [
      '2020-01-02T00:10:00.000Z',
      '2020-01-03T00:10:00.000Z',
      '2020-01-06T00:10:00.000Z',
      '2020-01-07T00:10:00.000Z'
    ];
    const expected = [
      { title: 'Lord Of The Fries', cron: '2020-01-01T00:10:00.000Z' },
    ];
    const received = cronBomb.explode({data, start, end, exclude, utc:true});
    expect(received).toEqual(expected);
  });

  it('still works if exluded dates do not exist in output', () => {

    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const data = {
      title: 'Lord Of The Fries',
      cron: '10 0 * * 1-5', // Every weekday at 11am
    };
    const exclude = [
      '2019-01-02T00:10:00.000Z', // Wrong year
      '2019-01-03T00:10:00.000Z',
      '2019-01-06T00:10:00.000Z',
      '2019-01-07T00:10:00.000Z'
    ];
    const expected =    [
      { title: 'Lord Of The Fries', cron: '2020-01-01T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-02T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-03T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-06T00:10:00.000Z' },
      { title: 'Lord Of The Fries', cron: '2020-01-07T00:10:00.000Z' }
    ];
    const received = cronBomb.explode({data, start, end, exclude, utc:true});
    expect(received).toEqual(expected);
  });
});

describe('intersection()', () => {
  it('gives the correct intersection of two crontabs', () => {
    const start = new Date('01 January 2020 00:00 UTC');
    const end = new Date('08 January 2020 00:00 UTC');
    const expected =    [
      '2020-01-01T13:10:00.000Z',
      '2020-01-02T13:10:00.000Z',
      '2020-01-05T13:10:00.000Z',
      '2020-01-06T13:10:00.000Z',
      '2020-01-07T13:10:00.000Z'
    ];
    const received = cronBomb.intersection({cron1: '10 0 * * 1-5', cron2: '10 0 * * 1-5', start, end});
    expect(received).toEqual(expected);
  });
});
