const config =  {
	PORT: 4000,
	//DB_ADDRESS: "mongodb://localhost:27017/messengerSocketIO",
	DB_ADDRESS: secret,
	JWT_SECRET_KEY: secret,
	JWT_EXPIRE_TIME: 2678400 ,
	
}

module.exports = config
