const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

const verifyJwt = (req, res, next)=>{
  console.log('inside verify token',req.headers.authorization)
  const authHeader = req.headers.authorization;
   if(!authHeader){
      return res.status(401).send('unauthorized access')
   };
   const token = authHeader.split(' ')[1];

   jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
       if(err){
        return res.status(403).send({message: 'forbidden access'})
       };
       req.decoded = decoded;
       next();
   })
}

async function run() {
  try {
          const packageCollection = client.db('travelAndTour').collection('packages');
          const bookingCollection = client.db('travelAndTour').collection('booking');
          const userCollection = client.db('travelAndTour').collection('users');

         const verifyAdmin = async(req, res, next)=>{
             const decodedEmail = req.decoded.email;
             const query = {email: decodedEmail};
             const user = await userCollection.findOne(query);
             if(user?.role !== 'admin'){
                  return res.status(404).send({message: 'forbidden access'})
             };
             next();
          }
          
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

          app.get('/bookings', verifyJwt, async(req, res)=>{
            const email = req.query.email;
            const query = {email: email};
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking)
          });

          app.delete('/booking/:id', async(req, res)=>{
             const id = req.params.id;
             const query = {_id: new ObjectId(id)};
             const result = await bookingCollection.deleteOne(query);
             res.send(result)
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

         app.get('/allUser', verifyJwt, verifyAdmin, async(req, res)=>{
            const query = {};
            const  allUser = await userCollection.find(query).toArray();
            res.send(allUser)
         });

          app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result)
          });

          app.put('/users/make/admin/:id',verifyJwt, verifyAdmin, async(req, res)=>{
             const id = req.params.id;
             const filter = {_id: new ObjectId(id)};
             const options = {upsert: true};
             const updateDoc = {
              $set: {
                role: 'admin'
              }
             }
             const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
          })

          app.get('/user/admin/:email', async(req, res)=>{
             const email = req.params.email;
             const query = {email: email};
             const user = await userCollection.findOne(query);
             res.send({isAdmin: user?.role === 'admin'})
          })

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