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
router.get('/showPets', async (req, res) => {
	try {
		console.log("show pets");

		const schema = Joi.string().max(30).required();
		const validationResult = schema.validate(req.query.id);
		if (validationResult.error != null) {
			console.log(validationResult.error);
			res.render('error', {message: 'Invalid user id'});
			return;
		}

		const petCollection = database.db('lab_example').collection('pets');
		const pets = await petCollection.find({user_id: new ObjectId(req.query.id)}).toArray();

		console.log(pets);
		res.render('pets', {allPets: pets, user_id: req.query.id});
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log(ex);
	}
});
router.post('/addPet', async (req, res) => {
	try {
		console.log("add pet");

		const schema = Joi.object({
			name: Joi.string().max(20).required(),
			user_id: Joi.string().max(30).required()
		});

		const validationResult = schema.validate(req.body);
		if (validationResult.error != null) {
			console.log(validationResult.error);
			res.render('error', {message: validationResult.error.message});
			return;
		}

		const petCollection = database.db('lab_example').collection('pets');
		await petCollection.insertOne({
			name: req.body.name,
			user_id: new ObjectId(req.body.user_id)
		});

		res.redirect("/showPets?id=" + req.body.user_id);
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log(ex);
	}
});
module.exports = router;