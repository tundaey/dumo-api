const mongoose = require('mongoose');
const chalk = require('chalk');

module.exports = {
	connectToServer: function(callback) {
		var mongoDB = process.env.MONGODB_URI;
		mongoose.Promise = global.Promise;
		mongoose.connect(mongoDB, {
			reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  		reconnectInterval: 500, // Reconnect every 500ms
  		poolSize: 10, // Maintain up to 10 socket connections
  		// If not connected, return errors immediately rather than waiting for reconnect
  		bufferMaxEntries: 0
		});
		mongoose.connection.on(
			'error',
			console.error.bind(
				console,
				'%s MongoDB connection error. Please make sure MongoDB is running.',
				chalk.red('✗')
			)
		);
		return callback();
	}
};
