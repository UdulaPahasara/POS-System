import mongoose from 'mongoose';
import Notification from './model/Notification.js';
import User from './model/User.js'; // needed for population

mongoose.connect('mongodb://localhost:27017/pos-system')
    .then(async () => {
        const notifs = await Notification.find().sort({createdAt: -1}).limit(5).populate('actor', 'username profilePic');
        console.log(JSON.stringify(notifs, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
