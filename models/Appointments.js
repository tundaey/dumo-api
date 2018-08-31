const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
	userID: String,
  day: { type: String },
  from: { type: String },
  to: { type: String },
  available: { type: Boolean},
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }]
});

const Appointment = mongoose.model(
	'Appointment',
	appointmentSchema,
	'Appointment'
);

module.exports = Appointment;
