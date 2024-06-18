const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const app = express();

const events = [];

app.use(bodyParser.json());

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
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput : EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      events: () => {
        //return ['Romantic Cooking', 'Sailing', 'All-Night Coding'];
        return events;
      },
      createEvent: (args) => {
        const event = {
            _id: Math.random().toString(),
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: args.eventInput.date
        };
        events.push(event);
        return event;
      }
    },
    graphiql: true
  })
);

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@testcluster1.wxdgvkq.mongodb.net/${process.env.MONGO_DB}`)
.then(() => {
    console.log("Successfully connected to database and listening on port:3000")
    app.listen(3000);
})
.catch(err => {
    console.log("Error connecting to database: " + err);
});