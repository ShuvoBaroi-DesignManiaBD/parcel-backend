const express = require("express");
const cors = require("cors");
require('dotenv').config()
const {
  MongoClient,
  ServerApiVersion,
  ObjectId
} = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middlewares
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
  next();
});
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions))
app.options("", cors(corsOptions))


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@design-mania-bd.kt3v02q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("parcel");
    const users = db.collection("users");
    const parcels = db.collection("parcels");

    // ============== User related APIs ===============
    // API for save user data
    app.put('/saveUser', async (req, res) => {
      // const email = req.params.email;
      const user = req.body;
      console.log(user);
      const query = {email: user.email};
      const options = {upsert: true};
      const isExist = await users.findOne(query);
      if (!isExist) {
       const result = await users.insertOne(user);
        return res.send(result);
      } else {
        const result = await users.updateOne(query,{
          $set: {...user, timestamp: Date.mow()}
        }, options);
        return res.send(result);
      }
    });
    
    app.patch('/beDeliveryMen/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const options = {upsert: true};
        const result = await users.updateOne(query,{
          $set: {role: 'deliveryman'}
        }, options);
        return res.send(result);
      });

    // API for getting all users data
    app.get('/users', async (req, res) => {
      const cursor = users.find();
      const result = await cursor.toArray();
      res.send(result);
    });  

    // API for finding a specific user
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const result = await users.findOne(query);
      res.send(result);
    });

    app.patch('/changeRole/:email', async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      console.log(data);
      const query = {email: email};
      const options = {upsert: true};
        const result = await users.updateOne(query,{
          $set: {role: data.role}
        }, options);
        return res.send(result);
      });
    // ================ Parcel Related APIs ==================
    // API for collecting new parcel data
    app.post('/addParcel', async (req, res) => {
      const parcel = req.body;
      const result = await parcels.insertOne(parcel);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({
      ping: 1
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Server is running.....");
});

app.listen(port, () => {
  console.log(`Server is running in port: ${port}`);
});