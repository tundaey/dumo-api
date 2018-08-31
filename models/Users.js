const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
	first: String,
	customer_id: String,
	last: String,
	email: String,
	password: String,
	refreshToken: String,
	profileComplete: Boolean,
	account_type: String,
	avatar: String,
	gender: String,
	price: Number,
	first_name: String,
	last_name: String,
	nickname: String,
	phone: String,
	sessions: {default: 0, type: Number },
});

const Users = mongoose.model('Users', usersSchema, 'Users');

module.exports = Users;
