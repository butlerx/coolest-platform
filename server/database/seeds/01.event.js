const uuid = require('uuid/v4');
const moment = require('moment');

exports.seed = (knex, Promise) =>
  knex.raw('TRUNCATE TABLE event CASCADE').then(() => {
    const eventDate = moment.utc().add(2, 'days');
    eventDate.set('hour', 23);

    return knex('event').insert({
      id: uuid(),
      date: eventDate,
      tz: 'Europe/Dublin',
      location: 'RDS Main Arena, Ballsbridge, Dublin 4',
      contact: 'help@coolestprojects.org',
      name: 'Coolest Projects International 2018',
      homepage: 'coolestprojects.org',
      slug: 'cp-2018',
      categories: { SC: 'Scratch', WEB: 'Websites & Web Games', EVO: 'Evolution' },
      categories_ages: { SC: [11], WEB: [10, 12], EVO: [] },
      registration_start: eventDate.clone().subtract(3, 'days'),
      registration_end: eventDate.clone().subtract(1, 'days'),
      freeze_date: eventDate.clone().subtract(1, 'days').toDate(),
      external_ticketing_uri: 'https://tickets.coolestprojects.org',
    });
  });
