const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId
const { MongoClient, ServerApiVersion } = require('mongodb');
const admin = require("firebase-admin");

// port number
const port = process.env.PORT || 5000;

//firebase admin
var serviceAccount = require('./aeromart-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v4fkr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyToken(req, res, next) {
  if(req.headers.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1];

    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    }
    catch{

    }
  }
  next()
}

async function run() {
   try {
      const database = client.db(`${process.env.DB_NAME}`);
      const productCollection = database.collection(`${process.env.DB_COLLECTION_PRODUCTS}`);
      const orderCollection = database.collection(`${process.env.DB_COLLECTION_ORDER}`);
      const reviewCollection = database.collection('review');
      const usersCollection = database.collection('users');

      app.get('/products', async(req, res) => {
        const query = productCollection.find({})
        const result = await query.toArray()
        res.send(result)
      })

      app.get('/purchase', async(req, res) => {
        const query = orderCollection.find({})
        const result = await query.toArray()
        res.send(result)
      })

      app.get('/reviewMsg', async(req, res) => {
        const query = reviewCollection.find({})
        const result = await query.toArray()
        res.send(result)
      })

      app.get('/users', async(req, res) => {
        const query = usersCollection.find({})
        const result = await query.toArray()
        res.send(result)
      })

      app.get('/purchaseEmail', async(req, res) => {
        const email = req.query.email;
        const filter = {email: email}
        const cursor = orderCollection.find(filter)
        const result = await cursor.toArray()
        res.send(result)
      })

      app.get('/products/:id', async(req, res) => {
        const id = req.params.id
        const cursor = {_id: ObjectId(id)}
        const result = await productCollection.findOne(cursor)
        res.send(result)
      })

      app.get('/purchase/:id', async(req, res) => {
        const id = req.params.id
        const cursor = {_id: ObjectId(id)}
        const result = await orderCollection.findOne(cursor)
        res.send(result)
      })

      app.get('/users/:email', async(req, res) => {
        const email = req.params.email
        const filter = {email: email}
        const user = await usersCollection.findOne(filter)
        let isAdmin = false;
        if(user?.role === 'admin'){
          isAdmin = true;
        }
        res.json({admin: isAdmin})
      })

      app.post('/products', async(req, res) => {
        const body = req.body;
        const result = await productCollection.insertOne(body);
        res.json(result);
      })

      app.post('/purchase', async(req, res) => {
        const body = req.body;
        const result = await orderCollection.insertOne(body);
        res.json(result);
      })

      app.post('/reviewMsg', async(req, res) => {
        const body = req.body;
        const result = await reviewCollection.insertOne(body);
        res.json(result);
      })

      app.post('/users', async(req, res) => {
        const body = req.body;
        const result = await usersCollection.insertOne(body);
        res.json(result);
      })

      app.put('/products/:id', async(req, res) => {
        const body = req.body;
        const id = req.params.id;
        const filter = {_id: ObjectId(id)}
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            carModelName: body.carModelName,
            carBrand: body.carBrand,
            color: body.color,
            liquid: body.liquid,
            price: body.price,
            description: body.description
          },
        };
        const result = await productCollection.updateOne(filter, updateDoc, options);
        res.json(result);
      })

      app.put('/purchase/:id', async(req, res) => {
        const body = req.body;
        const id = req.params.id;
        const filter = {_id: ObjectId(id)}
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            status: body.status
          },
        };
        const result = await orderCollection.updateOne(filter, updateDoc, options);
        res.json(result);
      })

      app.put('/OrderPurchase/:id', async (req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)}
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            paymentType: 'Done'
          }
        }
        const result = await orderCollection.updateOne(filter, updateDoc, options);
        res.json(result);
      })

      app.put('/users', async (req, res) => {
        const user = req.body;
        const filter = {email: user.email}
        const options = { upsert: true };
        const updateDoc = {
          $set: user
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.json(result);
      })

      app.put('/users/admin', verifyToken, async(req, res) => {
        const body = req.body
        const requester = req.decodedEmail;
        if(requester){
          const requestAccount = await usersCollection.findOne({ email: requester});
          if(requestAccount.role === 'admin'){
            const filter = {email: body.email}
            const options = { upsert: true };
            const updateDoc = { 
              $set:{
                role: 'admin'
              }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
          }
        }
        else{
          res.status(403).json({ message: 'you do not have access to make admin'})
        }
      })
     
      app.delete('/products/:id', async(req, res) => {
        const id = req.params.id;
        const cursor = {_id: ObjectId(id)}
        const result = await productCollection.deleteOne(cursor);
        res.json(result);
      })

      app.delete('/purchase/:id', async(req, res) => {
        const id = req.params.id;
        const cursor = {_id: ObjectId(id)}
        const result = await orderCollection.deleteOne(cursor);
        res.json(result);
      })

      app.delete('/reviewMsg/:id', async(req, res) => {
        const id = req.params.id;
        const cursor = {_id: ObjectId(id)}
        const result = await reviewCollection.deleteOne(cursor);
        res.json(result);
      })

      app.delete('/users/:id', async(req, res) => {
        const id = req.params.id;
        const cursor = {_id: ObjectId(id)}
        const result = await usersCollection.deleteOne(cursor);
        res.json(result);
      })

   } finally {
     //await client.close();
   }
 }
 run().catch(console.dir);



// server running
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// listening port
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})