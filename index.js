const express = require('express');
const http = require('http');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const  cors = require('cors');

//route inititializations
const userRoutes = require('./routes/userRoutes')
const dietPlanRoutes = require('./routes/dietPlanRoutes')



var app = express();
var server = http.createServer(app);

const port = process.env.PORT || 5550;

mongoose.Promise = global.Promise;
//live
mongoose.connect('mongodb+srv://****************@demo.seo4o.mongodb.net/?retryWrites=true&w=majority&appName=Demo')
  .then(() => {
    console.log("DataBase connected.");
    console.log("Fetched Live Data.");
  })
  .catch((err) => {
    console.log("db connection error");
    console.log(err);
  });


app.use(cors());
app.use(express.json());
app.use(bodyParser.json({limit : '150mb'}));
app.use(bodyParser.urlencoded({extended :true,iit :'150 mb'}));
app.use(userRoutes)
app.use(dietPlanRoutes);  




server.listen(port, () => {
    console.log(`Server with ws capability running on port ${port}`);
    console.log("Database Connection Initiated")
}); 