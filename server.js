//There were not really any variables planned for the server, as the most variables used are those received from the client

const express = require('express'); //Gets the ExpressJS framework
const cors = require('cors'); //Gets the library for facilitating cross-origin resource sharing
const bodyParser = require('body-parser'); //Allows for the parsing of JSON
const mongo = require('mongodb'); //Gets the MongoDB library
const bcrypt = require('bcrypt-nodejs'); //Gets the library for encrypting and decrypting passwords

const app = express(); //Begins the Express app

var MongoClient = require('mongodb').MongoClient; //Variable that gets the MongoDB client

//UNPLANNED: Variable that stores the url to the MongoDB database
const url = "mongodb+srv://taxscratch2:Jesus213@cluster0.nfpo2.mongodb.net/exam-prepare?retryWrites=true&w=majority"; 

var ObjectId = require('mongodb').ObjectID; //UNPLANNED: Variable for getting the ID of database entries

//Tells the server to use the bodyParser library for parsing JSON files
app.use(bodyParser.json());

//Tells the app to use the cors library for facilitating cross-origin resource sharing
app.use(cors());

//POST command for signing in the user
app.post('/signin', (req,res) => {
	const { email, password } = req.body; //Gets the email and password from the client
	const hash = bcrypt.hashSync(password); //Encrypts the password

	//Connects to MongoDB 
	MongoClient.connect(url, function(err, db){
		//Checks for any errors
		if (err) throw err;

		//Defines the name of the database to be accessed
		var dbo = db.db("exam-prepare");

		//Query to be used for finding a user by their email
		var query = { email: email }

		//Lookks through "users" document to find if the email exists on the database
	  dbo.collection("users").find(query).toArray(function(err, result) {

	  	//Checks to see if there is an error and returns a message if so
	    if (err){
	    	console.log("didnt work")
	    	res.status(400).json('Unable to sign in; wrong credentials');
	    }
	    
	    //Checks to see if the email is found
	    if(result[0] != undefined){
	    	//Checks to see if the password matches, if so returns the user object
		    if (bcrypt.compareSync(password, result[0].password)){
		    	res.json(result[0]);
		    }

		//If the password does not exist, return an error
	    }else{
	    	console.log("didnt work");
	    	res.status(400).json('Unable to sign in; wrong credentials');
	    }
	    
	    //Closes the database
	    db.close();
	  })
	});
})

//GET command for retrieving entries from the database
app.get('/getEntries', (req, res) => {

	//Connects to MongoDB
	MongoClient.connect(url, function(err, db){
		//Checks for any errors
		if (err) throw err;

		
		var dbo = db.db("exam-prepare"); //Defines the name of the database to be accessed

		//Attempts to retrieve the entire "entries" document/array from the database
		dbo.collection("entries").find().toArray(function(err, result){

			//If the "entries" document/array is found, returns it to the client
			if(result != undefined){
				res.json(result);

			//If the "entries" document/array is not found, returns an error to the client
			}else{
				console.log("didn't work");
				res.status(400).json('Unable to sign in; wrong credentials');
			}

			//Closes the database
			db.close();
		})
	})
})



//POST command for adding (registering) a user to the database
app.post('/register', (req, res) => {
	const { name, email, password } = req.body; //Gets the name, email and password from the client
	
	const hash = bcrypt.hashSync(password); //Encrypts the password

	//Connects to MongoDB
	MongoClient.connect(url, function(err, db) {

	//Checks for any errors
	  if (err) throw err;

	
	  var dbo = db.db("exam-prepare"); //Defines the name of the database to be accessed

	//Creates a user object using the name, email and password received from the client
	  var myobj = {
		name: name, //The name of the user
		email: email, //The email of the user
		password: hash //The password of the user
	  };

	  //Checks to see if the email being registered already exists
	  dbo.collection("users").find({email: email}).toArray(function(err, result){

	  	//If the email being registered is unique...
	  	if(result.length == 0){

	  	//Inserts the user in the "users" document/array
		  dbo.collection("users").insertOne(myobj, function(err, response) {

		  	//Checks for any errors during connection and returns an error message
		    if (err){
		    	res.status(400).json('invalid')
		    }
		    
		    //Makes sure that the email, password or name isn't blank and returns the registerd user
		    if(email !== '' || password !== '' || name !== ''){
		    	res.json(response.ops);

		    //If one is blank, returns an error message
		    }else{
		    	res.status(400).json("One of the fields is blank; couldn't return user");
		    }

		    //Closes the database
		    db.close();
		  });	  		

		//If the email being registered already exists on the database, return an error message
	  	}else{
	  		res.status(400).json("Unable to sign in; existing user");
	  	}
	  })	
	  
	});

	console.log('worked');
})

//PUT command for adding a new comment to an entry
app.put('/newComment', (req, res) => {

	//Connects to MongoDB
	MongoClient.connect(url, function(err, db){

		//Checks for any errors
		if (err) throw err;

		//Defines the name of the database to be accessed
		var dbo = db.db("exam-prepare");

		//Stores the new comment that is to be pushed to the database
		var newValues = { $set: {comments: req.body.comments} }

		//Uses the ID of the entry to match it with the correct one on the database and updates the commments array of the entry 
		dbo.collection("entries").update({_id: ObjectId(req.body._id)}, newValues, function(err, response){

			//Checks for any errors during database connection
			if (err) throw err;

			//Returns the resulting object to the client
			res.json(response);
			console.log(response)

			//Closes the database
			db.close();
		})
	})
})

//POST command for adding a new entry
app.post('/newEntry', (req, res) => {

	//Gets all of these variables containing information about the entry from the client
	const { type, yearLevel, subject, topic, description, time, creator, resourceValues, quizQuestions, comments } = req.body;

	//Connects to MongoDB
	MongoClient.connect(url, function(err, db) {

		//Checks for any errors
	  if (err) throw err;

	  //Defines the name of the database to be accessed
	  var dbo = db.db("exam-prepare");

	  //Makes an entry object using the variables received from the client
	  var myObj = {
	  	type: type, //The type of entry, Quiz or Resource
	  	yearLevel: yearLevel, //Year level for the entry
	  	subject: subject, //The subject of the entry
	  	topic: topic, //The topic of the entry
	  	description: description, //The description of the entry
	  	time: time, //The time limit of the entry (only for quizzes)
	  	creator: creator, //The creator of the entry
	  	resourceValues: resourceValues, //The value of the resource (if the entry is a resource)
	  	quizQuestions: quizQuestions, //The quiz questions of the entry (only for quizzes)
	  	comments: comments //Array storing the comments of the entry
	  }
	  
	  //Inserts the new entry into the "entries" document/array on the database
	  dbo.collection("entries").insertOne(myObj, function(err, response) {

	  	//Returns the response from the server to the client
	    res.json(response.ops);

	    //Closes the database
	    db.close();
	  });
	});
})

app.get('/', function(req, res){
   res.header("Access-Control-Allow-Origin", "*");
   res.send("working");
   console.log('worked');
});

app.listen(process.env.PORT, process.env.IP);