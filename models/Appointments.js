const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
	userID: String,
  day: { type: Date },
  time: { type: Date },
  available: { type: Boolean}
});

const Appointment = mongoose.model(
	'Appointment',
	appointmentSchema,
	'Appointment'
);

module.exports = Appointment;
