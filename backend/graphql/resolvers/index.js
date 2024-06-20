module.exports = {
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
};