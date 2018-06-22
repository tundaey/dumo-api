const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/auth.js');
const auth = require('./auth');
const errors = require('./error');
const Users = require('../models/Users');
const Appointments = require('../models/Appointments');
const moment = require('moment')

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

router.get('/profile/appointments/:day', (req, res) => {
	
	console.log('js date', moment(req.params.day).toDate())
	const date = moment(req.params.day).toDate()

	Appointments.find({email: req.user.email, day: date})
		.then(appointments => {
			console.log('apointments', appointments)
			res.status(200).send({
				success: true,
				appointments,
			});
		})
		.catch(err => {
			return errors.errorHandler(res, err);
		});
});

router.post('/profile/appointments/:day', (req, res) => {
	
	console.log('js date', moment(req.params.day).toDate())
	console.log('js time', moment(req.body.time, 'HH:mm a').toDate().getTime())
	const date = moment(req.params.day).toDate()
	const time = moment(req.body.time, 'HH:mm a').toDate().getTime()

	Appointments.find({userID: req.user.email, day: date, time: time})
		.then(appointments => {
			if(appointments.length <= 0) {
				let appointment = new Appointments()
				appointment.userID = req.user.email; 
				appointment.day = date; 
				appointment.time = time; 
				appointment.available = req.body.available;
				appointment.save().then(a => {
					res.status(200).send({
						success: true,
						appointment: a,
					});
				})
			} else {
				let existingAppointment = appointments[0]
				existingAppointment.day = date; 
				existingAppointment.time = time; 
				existingAppointment.available = req.body.available;
				existingAppointment.save().then(e => {
					res.status(200).send({
						success: true,
						appointment: e,
					});
				})
			}
			
		})
		.catch(err => {
			return errors.errorHandler(res, err);
		});
});

module.exports = router;
