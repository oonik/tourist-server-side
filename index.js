const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bwrtzwz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
          const packageCollection = client.db('travelAndTour').collection('packages');
          const bookingCollection = client.db('travelAndTour').collection('booking');
          const userCollection = client.db('travelAndTour').collection('users');
          
          app.get('/package', async (req, res)=>{
            const query = {};
            const result = await packageCollection.find(query).toArray();
            res.send(result)
          });

          app.post('/booking', async (req, res)=>{
             const book = req.body;
             const result = await bookingCollection.insertOne(book);
             res.send(result)
          });

          app.get('/bookings', async(req, res)=>{
            const email = req.query.email;
            const query = {email: email};
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking)
          })

         app.get('/jwt', async(req, res)=>{
            const email = req.query.email;
            const query = {email:email}
            const user = await userCollection.findOne(query);
            if(user){
              const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN, {expiresIn: '2h'});
              return res.send({accessToken: token})
            }
            res.status(403).send({accessToken: ''})
         });

          app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result)
          });

  } finally {
    
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('tourist server side is running')
});

app.listen(port, ()=>{
    console.log(`tourist server running on port ${port}`)
});