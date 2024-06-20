const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();

const Event = require('./models/event.js');
const User = require('./models/user.js');

app.use(bodyParser.json());

const events = eventIds => {
  return Event.find({ _id: { $in: eventIds } })
    .then(events => {
      return events.map(event => {
        return { ...event._doc, _id: event.id, creator: user.bind(this, event.creator) };
      })
    })
    .catch(err => {
      throw err;
    });
};

const user = userId => {
  return User.findById(userId)
    .then(user => {
      return { ...user._doc, _id: user.id, createdEvents: events.bind(this, user._doc.createdEvents) };
    })
    .catch(err => {
      throw err;
    });
};

app.use(
  '/graphql',
  graphqlHttp({
    schema: buildSchema(`
        type Event {
          _id: ID!
          title: String!
          description: String!
          price: Float!
          date: String!
          creator: User!
        }

        type User {
          _id: ID!
          email: String!
          password: String
          createdEvents: [Event!]
        }

        input EventInput {
          title: String!
          description: String!
          price: Float!
          date: String!
        }

        input UserInput {
          email: String!
          password: String!
        }

        type RootQuery {
          events: [Event!]!
        }

        type RootMutation {
          createEvent(eventInput : EventInput): Event
          createUser(userInput : UserInput): User
        }

        schema {
          query: RootQuery
          mutation: RootMutation
        }
    `),
    rootValue: {
      events: () => {
        return Event.find()
          .then((events) => {
            return events.map(event => {
              return {
                ...event._doc,
                _id: event.id,
                creator: user.bind(this, event._doc.creator)
              };
            });
          })
          .catch(err => {
            throw err;
          });
      },
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: '6672dacdc4bd75a8a347a166'
        });
        let createdEvent;
        return event.save()
          .then((result) => {
            createdEvent = { ...result._doc, _id: result._doc._id.toString(), creator: user.bind(this, result._doc.creator) };
            return User.findById('6672dacdc4bd75a8a347a166');
          })
          .then(user => {
            if (!user) {
              throw new Error('User not found');
            }
            user.createdEvents.push(event);
            return user.save();
          })
          .then(result => {
            return createdEvent;
          })
          .catch(err => {
            console.log("Error saving event: " + err);
            throw err;
          });
      },
      createUser: args => {
        return User.findOne({
          email: args.userInput.email
        })
          .then(user => {
            if (user) {
              //prevents duplicate values
              throw new Error('User already exists');
            }
            return bcrypt.hash(args.userInput.password, 12)
          })
          .then(hashedPassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword
            });
            return user.save();
          })
          .then(result => {
            return { ...result._doc, password: null, _id: result.id };
          })
          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@testcluster1.wxdgvkq.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true`)
  .then(() => {
    console.log("Successfully connected to database and listening on port:3000")
    app.listen(3000);
  })
  .catch(err => {
    console.log("Error connecting to database: " + err);
  });