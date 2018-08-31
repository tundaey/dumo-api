const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  charge_id: { type: String },
  amount: { type: String },
  date: { type: Date, default: Date.now() },
  completed: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, ref: 'Users' },
  trainer: { type: Schema.Types.ObjectId, ref: 'Users' }
});

const Transaction = mongoose.model(
	'Transaction',
	transactionSchema,
	'Transaction'
);

module.exports = Transaction;
