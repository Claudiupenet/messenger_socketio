const mongoose = require('mongoose');
const CONFIG = require('../config');
var ObjectId = mongoose.Schema.Types.ObjectId;

//Se face conexiunea la baza de date cu mongoose
mongoose.connect(CONFIG.DB_ADDRESS, { useNewUrlParser: true })
	.then(data => {
		console.log("Connected to DB")
	})
	.catch(err => {
		console.log(err);
	})
//Se extrage contructorul de schema
var Schema = mongoose.Schema;


//Se creeaza schema utilizatorului cu toate constrangerile necesare
var UserSchema = new Schema({
	firstName: { type: String, required: true, trim: true },
	lastName: {type: String, required: true, trim: true },
	email: { type: String, required: true, unique: true, trim: true },
	password: { type: String, required: true, trim: true, select: false },
	description: { type: String },
	picture: { type: String, trim: true },
	phone: { type: String, trim: true },
	age: { type: Number, min: 16, max: 120 },
	sex: { type: String, enum: ["Male", "Female", null], trim: true },
	friends: [	{friend: {type: Schema.Types.ObjectId, ref: 'User'},
				status: Number,
				_id: false,
				conversation: {type: Schema.Types.ObjectId, ref: 'Conversation'},
				last_activity: {message: String, author: String, timestamp: Date}}	]
}, {
		versionKey: false,
		timestamps: true
	})

	
//Se adauga schema sub forma de "Colectie" in baza de date
var User = mongoose.model("User", UserSchema);
//Se exporta modelul de control
module.exports = User;