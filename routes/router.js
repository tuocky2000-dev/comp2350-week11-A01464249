const router = require('express').Router();
const database = include('databaseConnection');

const crypto = require('crypto');
const {v4: uuid} = require('uuid');
const Joi = require('joi');
const {ObjectId} = require('mongodb');

const passwordPepper = "SeCretPeppa4MySal+";

router.get('/', async (req, res) => {
	console.log("page hit");
	try {
		const userCollection = database.db('lab_example').collection('users');
		const users = await userCollection.find().project({first_name: 1, last_name: 1, email: 1, _id: 1}).toArray();
		if (users === null) {
			res.render('error', {message: 'Error connecting to MongoDB'});
		}
		else {
			console.log(users);
			res.render('index', {allUsers: users});
		}
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log(ex);
	}
});

router.post('/addUser', async (req, res) => {
	try {
		console.log("form submit");
		const schema = Joi.object({
			first_name: Joi.string().max(20).required(),
			last_name: Joi.string().max(20).required(),
			email: Joi.string().email().required(),
			password: Joi.string().max(20).required()
		});

		const validationResult = schema.validate(req.body);
		if (validationResult.error != null) {
			console.log(validationResult.error);
			res.render('error', {message: validationResult.error.message});
			return;
		}

		const saltHash = crypto.createHash('sha512');
		saltHash.update(uuid());
		const saltValue = saltHash.digest('hex');

		const passwordHash = crypto.createHash('sha512');
		passwordHash.update(req.body.password + passwordPepper + saltValue);

		const userCollection = database.db('lab_example').collection('users');
		await userCollection.insertOne({
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email,
			password_salt: saltValue,
			password_hash: passwordHash.digest('hex')
		});

		res.redirect("/");
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log(ex);
	}
});

router.get('/deleteUser', async (req, res) => {
	try {
		console.log("delete user");
		const schema = Joi.string().max(30).required();
		const validationResult = schema.validate(req.query.id);
		if (validationResult.error != null) {
			console.log(validationResult.error);
			res.render('error', {message: 'Invalid user id'});
			return;
		}

		const userCollection = database.db('lab_example').collection('users');
		await userCollection.deleteOne({_id: new ObjectId(req.query.id)});

		res.redirect("/");
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log(ex);
	}
});
module.exports = router;