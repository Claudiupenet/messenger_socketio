const mongoose = require('mongoose');
const CONFIG = require('../config');
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
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	description: { type: String, },
	picture: { type: String },
	phone: { type: String, },
	age: { type: Number, min: 16, max: 120 },
	sex: { type: String, enum: ["Male", "Female", null] },
	friends: {type: Array}
}, {
		versionKey: false
	})
	
//Se adauga schema sub forma de "Colectie" in baza de date
var User = mongoose.model("users", UserSchema);
//Se exporta modelul de control
module.exports = User;