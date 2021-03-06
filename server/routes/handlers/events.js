const eventController = require('../../controllers/events');
const projectController = require('../../controllers/projects');
const Category = require('../../models/category');

module.exports = {
  get: [
    (req, res, next) =>
      eventController.get({ slug: req.params.slug })
        .then(_event => res.status(200).json(_event))
        .catch((err) => {
          req.app.locals.logger.error(err);
          return next(new Error('Error while searching for an event.'));
        }),
  ],
  sendConfirmAttendanceEmail: [
    async (req, res, next) => {
      try {
        res.locals.event = await eventController.get({ id: req.params.eventId });
        return next();
      } catch (err) {
        req.app.locals.logger.error(err);
        return next(new Error('Error while sending confirm attendance emails'));
      }
    },
    async (req, res, next) => {
      try {
        const event = res.locals.event;
        const projects = await projectController.getExtended({
          scopes: { event_id: event.id },
          query: { status: 'pending', deletedAt: null },
        });
        event.attributes.timesConfirmationEmailSent += 1;
        await req.app.locals.mailing.sendConfirmAttendanceEmail(projects.toJSON(), {
          ...event.attributes,
          date: event.formattedDate(),
        });
        return next();
      } catch (err) {
        req.app.locals.logger.error(err);
        return next(new Error('Error while sending confirm attendance emails'));
      }
    },
    async (req, res, next) => {
      const event = res.locals.event;
      await eventController.update(event, {
        lastConfirmationEmailDate: new Date(),
        timesConfirmationEmailSent: event.attributes.timesConfirmationEmailSent,
      });
      return next();
    },
    async (req, res, next) => res.status(204).send(),
  ],
  generateSeating: [
    (req, res, next) =>
      eventController.get({ id: req.params.eventId })
        .then((event) => { res.app.locals.event = event; next(); })
        .catch((err) => {
          req.app.locals.logger.error(err);
          return next(new Error('Error while searching for an event.'));
        }),
    (req, res, next) => {
      if (res.app.locals.event.attributes.seatingPrepared) {
        return next(new Error('Cannot regenerate the seating'));
      }
      return next();
    },
    (req, res, next) => {
      const categories = res.app.locals.event.attributes.categories;
      const categoriesAges = res.app.locals.event.attributes.categoriesAges;
      return Promise.all(Object.keys(categories)
        .map(catName => projectController
          .setSeatingPerCategory(new Category(catName, categoriesAges[catName]))))
        .then(() => next())
        .catch((err) => {
          req.app.locals.logger.error(err);
          return next(new Error('Error while generating seating'));
        });
    },
    (req, res, next) =>
      eventController.update(res.app.locals.event, { seatingPrepared: true })
        .then(() => {
          res.app.locals.event.refresh();
          return next();
        })
        .catch((err) => {
          req.app.locals.logger.error(err);
          return next(new Error('Error saving event status'));
        }),
    (req, res, next) =>
      res.status(200).send(res.app.locals.event),
  ],
};
