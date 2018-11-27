const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/auth.js');
const auth = require('./auth');
const errors = require('./error');
const Users = require('../models/Users');
const Appointments = require('../models/Appointments');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const moment = require('moment');
const stripe = require("stripe")("sk_test_bGpbLyuW65wPTm4kOnOBmMqG");

router.post('/signup', (req, res) => {
	auth
		.registerUser(
			req.body.email,
			req.body.password,
			req.body.account_type,
		)
		.then(user => {
			console.log('signup resolved', user)
			auth.logUserActivity(user, 'signup');
			let authToken = auth.createToken(user);
			let refreshToken = auth.createRefreshToken(user);
			return Promise.all([
				authToken,
				refreshToken,
			])
		})
		.then((tokens) => {
			console.log('tokens resolved', tokens)
			res.send({
				success: true,
				authToken: tokens[0],
				refreshToken: tokens[1],
			});
		})
		.catch(err => {
			console.log('err', err)
			return errors.errorHandler(res, err);
		});
});

router.post('/login', (req, res) => {
	auth
		.loginUser(req.body.email, req.body.password)
		.then(user => {
			let authToken = auth.createToken(user);
			let refreshToken = auth.createRefreshToken(user);
			let userActivityLog = auth.logUserActivity(user, 'login');
			return Promise.all([
				authToken,
				refreshToken,
				Promise.resolve(user),
				userActivityLog
			]).then(tokens => {
				return {
					authToken: tokens[0],
					refreshToken: tokens[1],
					user: tokens[2]
				};
			});
		})
		.then(success => {
			res.send({
				success: true,
				authToken: success.authToken,
				refreshToken: success.refreshToken,
				user: success.user
			});
		})
		.catch(err => {
			return errors.errorHandler(res, err);
		});
});

router.post('/refreshToken', (req, res) => {
	auth
		.validateRefreshToken(req.body.refreshToken)
		.then(tokenResponse => {
			return auth.createToken(tokenResponse);
		})
		.then(authToken => {
			res.status(200).send({
				success: true,
				authToken: authToken
			});
		})
		.catch(err => {
			if (err.code) {
				return errors.errorHandler(res, err.message, err.code);
			} else {
				return errors.errorHandler(res, err.message);
			}
		});
});

router.use((req, res, next) => {
	var token = req.headers['authorization'];
	token = token.replace('Bearer ', '');
	return jwt.verify(token, config.secret, function(err, decoded) {
		if (err) {
			return errors.errorHandler(
				res,
				'Your access token is invalid.',
				'invalidToken'
			);
		} else {
			req.user = decoded;
			next();
		}
	});
});

router.put('/profile', (req, res) => {
	Users.findOne({email: req.user.email})
		.then(user => {
			user.first_name = req.body.first_name;
			user.last_name = req.body.last_name;
			user.nickname = req.body.nickname;
			user.avatar = req.body.avatar;
			user.price = req.body.price;
			user.phone = req.body.phone;
			user.gender = req.body.gender;
			user.account_type = req.body.account_type;
			user.profileComplete = true;
			user.save().then(savedUser => {
				res.status(201).send({
					success: true,
					user: savedUser
				});
			})
			
		})
		.catch(err => {
			return errors.errorHandler(res, err);
		});
});

router.get('/profile', (req, res) => {
	Users.findOne({email: req.user.email})
		.then(user => {
			res.status(200).send({
				success: true,
				user,
			});
		})
		.catch(err => {
			return errors.errorHandler(res, err);
		});
});

router.get('/profile/appointments/', (req, res) => {
	
	//console.log('js date', moment(req.params.day).toDate())
	//const date = moment(req.params.day).toDate()

	Appointments.find({userID: req.user.email})
		.then(appointments => {
			return res.status(200).send({
				success: true,
				appointments: appointments,
			});
		})
		.catch(err => {
			console.log('err', err)
			return errors.errorHandler(res, err);
		});
});

router.post('/appointments/:day', (req, res) => {
	
	//console.log('js date', moment(req.params.day).toDate())
	//const date = moment(req.params.day).toDate()
	//console.log('user', req.user)
	Appointments.find({day: req.params.day})
		.then(appointments => {
			if(appointments.length > 0) {
				return res.status(403).send({ success: false })
			}
			const newAppointment = new Appointments({
				day: req.params.day,
				from: req.body.from,
				to: req.body.to,
				userID: req.user.email
			})

			newAppointment.save((savedAppointment) => {
				return res.status(200).send({
					success: true,
					appointment: {
						day: req.params.day,
						from: req.body.from,
						to: req.body.to,
					}
				});
			})
		})
		.catch(err => {
			console.log('err', err)
			return errors.errorHandler(res, err);
		});
});

router.get('/user/:email/appointments/', (req, res) => {
	
	//console.log('js date', moment(req.params.day).toDate())
	//const date = moment(req.params.day).toDate()

	Appointments.find({userID: req.params.email})
		.then(appointments => {
			return res.status(200).send({
				success: true,
				appointments: appointments,
			});
		})
		.catch(err => {
			console.log('err', err)
			return errors.errorHandler(res, err);
		});
});

router.get('/appointments/:day/:email', (req, res) => {
	Appointments.findOne({userID: req.params.email, day: req.params.day})
	.populate('bookings')
		.then(appointment => {
			return res.status(200).send({
				success: true,
				appointment: appointment,
			});
		})
		.catch(err => {
			return res.status(401).send({
				success: false
			})
		});
});

router.post('/appointments/search', (req, res) => {
	
	console.log('body', req.body);
	//const date = moment(req.params.day).toDate()
	//const time = moment(req.body.time, 'HH:mm a').toDate().getTime()

	Appointments.find({})
		.then(appointments => {
			return res.status(200).send({
				success: true,
				appointments: appointments,
			});
		})
		.catch(err => {
			console.log('error', err)
			return res.status(401).send({
				success: false
			})
		});
});

router.get('/users', (req, res) => {
	Users.find({})
	.then(users => {
		console.log('users', users)
		return res.status(200).send({
			success: true,
			appointments: users
		})
	})
	.catch( (err) => {
		return res.status(401).send({
			success: false
		})
	})
})

router.post('/pay/create', async (req, res) => {
	const { customer_id, amount, user_id, trainer_id, appointment_id, time } = req.body;

	if(customer_id) {
		
		const charge = await chargeCustomer(customer_id)
		
		const appointment = await createTransactionAndUpdateAppointment({
			charge,
			amount,
			req,
			trainer_id,
			time,
			appointment_id: appointment_id,
		})


		return res.status(200).send({
			success: true
		});
		
	}
	
	try {
		// create new customer
		const customer = await stripe.customers.create({
			source: 'tok_mastercard',
			email: 'paying.user@example.com',
		});

		// Charge the Customer instead of the card:
		const charge = await chargeCustomer(customer.id)

		//update user with customer_id
		const updatedUser = await Users.findOneAndUpdate(
			{ _id: req.user._id }, 
			{ $set: { customer_id: customer.id } },
		)

		await createTransactionAndUpdateAppointment({
			charge,
			amount,
			req,
			trainer_id,
			time,
			appointment_id: appointment_id,
		})

		return res.status(200).send({
			success: true
		});

	} catch (error) {
		console.log('pay create error', error)
	}
	

})

router.post('/pay/charge', async (req, res) => {
	const charge = stripe.Charges.capture('ch_H19bAwOmV5vwdQ3Ipp3z')
})

router.get('/bookings', async (req, res) => {
	console.log('query', req.query)
	try {
		if(req.query.status) {
			const bookings = await Booking.find({ status: req.query.status})
			.populate('trainer')
			.populate('user')
			.populate('appointment')
			.exec((error, b) => b)

			return res.status(200).send({
				success: true,
				bookings,
			});
		}else {
			// status should be created || in_progress || completed 
			const bookings = req.query.type === 'from_you' 
			? await Booking.find({ status: 'created', user: req.user._id})
			.populate('trainer')
			.populate('user')
			.populate('appointment')
			.populate('transaction')
			.exec((error, b) => b)
			: await Booking.find({ status: 'created', trainer: req.user._id})
			.populate('trainer')
			.populate('user')
			.populate('appointment')
			.populate('transaction')
			.exec((error, b) => { console.log('b', b); return b});
			
			return res.status(200).send({
				success: true,
				bookings,
			});
		}
	} catch (error) {
		return res.status(401).send({
			success: false
		})
	}
})

router.post('/bookings/accept', async (req, res) => {
	try {
		const booking = await Booking.findOneAndUpdate(
			{ _id: req.body }, 
			{ status: 'accepted'},
			//{safe: true, upsert: true, new : true},
		)
		return res.status(200).send({
			success: true,
			booking,
		});
	} catch (error) {
		return res.status(401).send({
			success: false
		})
	}
})

const chargeCustomer = async (customer_id) => {
	 // Charge the Customer instead of the card:
	const charge = await stripe.charges.create({
    amount: 1000,
    currency: 'usd',
    customer: customer_id,
	});

	return charge;
}

const createTransaction = (charge, amount, user_id, trainer_id) => {
	const newTransaction = new Transaction()
	newTransaction.charge_id = charge.id;
	newTransaction.amount = amount;
	newTransaction.user_id = user_id;
	newTransaction.trainer_id = trainer_id;
	return newTransaction;
}

const createBooking = (appointment_id, user_id, trainer_id, time, transaction) => {
	const newBooking = new Booking();
	newBooking.appointment = appointment_id
	newBooking.user = user_id
	newBooking.trainer = trainer_id
	newBooking.time = time
	newBooking.transaction = transaction._id
	newBooking.status = 'created'
	return newBooking
}

const createTransactionAndUpdateAppointment = async ({
	charge,
	amount,
	req,
	trainer_id,
	time,
	appointment_id,
}) => {
	try {
		//create transaction with charge_id
		const newTransaction = createTransaction(charge, amount, req.user._id, trainer_id );
		//save transaction
		const savedTransaction = await newTransaction.save();

		// save booking
		const newBooking = createBooking(appointment_id, req.user._id, trainer_id, time, savedTransaction)
		const savedBooking = await newBooking.save();
		console.log('saved booking', savedBooking)

		// get appointment by id
		const appointment = await Appointments.findOneAndUpdate(
			{ _id: appointment_id }, 
			{ $push: { bookings: savedBooking._id } },
			//{safe: true, upsert: true, new : true},
		)

		return appointment
	} catch (error) {
		
	}
}

module.exports = router;
