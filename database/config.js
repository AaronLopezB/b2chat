const mongoose = require('mongoose');

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('DB Online');
    } catch (error) {
        console.log(`Error connecting to the database: ${error}`);
        throw new Error('Error connecting to the database', error);
    }
}

module.exports = {
    dbConnection
}