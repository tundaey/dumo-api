const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'Users' },
	trainer: { type: Schema.Types.ObjectId, ref: 'Users' },
	appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
	transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  time: { type: String },
  status: { type: String },
  completed: { type: Boolean, default: false },
});

const Booking = mongoose.model(
	'Booking',
	bookingSchema,
	'Booking'
);

module.exports = Booking;
