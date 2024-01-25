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
    const reviews = db.collection("reviews");

    // ============== User related APIs ===============
    // API for save user data
    app.put('/saveUser', async (req, res) => {
      // const email = req.params.email;
      const user = req.body;
      console.log(user);
      const query = {email: user?.email};
      const options = {upsert: true};
      const isExist = await users.findOne(query);
      if (!isExist) {
       const result = await users.insertOne(user);
        return res.send(result);
      } else {
        const result = await users.updateOne(query,{
          $set: {...user, timestamp: Date.now()}
        }, options);
        return res.send(result);
      }
    });
    
    // ========= DeliveryMan related APIs ========
    // API for be a delivery man
    app.patch('/beDeliveryMen/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const options = {upsert: true};
        const result = await users.updateOne(query,{
          $set: {role: 'deliveryman'}
        }, options);
        return res.send(result);
      });

    // API for finding a specific deliveryman
    app.get('/deliveryman/:id', async (req, res) => {
      const id = req.params.id;
      const queryById = {_id: new ObjectId(id)};
      const result = await users.findOne(queryById)
      res.send(result);
    });

    // API for getting all DeliveryMen
    app.get('/allDeliveryMan', async (req, res) => {
      const page = req?.query?.page;

      const query = {role: 'deliveryman'};
      const result = await users.find(query);
      if (page) {
        const pageNumber = parseInt(page);
        const perPage = 5;
        const skip = pageNumber * perPage;
        const deliveryMen = await result.skip(skip).limit(perPage).toArray();
      const count = await users.countDocuments(query);
      res.send({deliveryMen, count});
      } else {
        const list = await result.toArray();
        res.send(list);
      }
      
    });

    // API for getting all users data
    app.get('/users', async (req, res) => {
      const page = req.query.page;
      const pageNumber = parseInt(page);
      const perPage = 5;
      const skip = pageNumber * perPage;
      const cursor = await users.find();
      const allUsers = await cursor.skip(skip).limit(perPage).toArray();
      const usersCount = await users.countDocuments();
      res.send({allUsers, usersCount});
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
    // API for collecting new parcel data to database
    app.post('/addParcel', async (req, res) => {
      const parcel = req.body;
      const email = parcel.email;
      const price = parcel.price;
      const phone = parcel.phone;
      const query = {email: email};
      const options = {upsert: true};
      const user = await users.findOne(query);
      const updateUser = await users.updateOne(query,{
          $set: {parcelBooked: user?.parcelBooked? user?.parcelBooked + 1 : 1,
          totalSpent: user?.totalSpent ? user.totalSpent + price : price,
          phone: user?.phone ? user.phone : phone,
          }
        }, options);
      const result = await parcels.insertOne(parcel);

      res.send({result, updateUser})
    });

    // API for updating a parcel data
    app.put('/updateParcel', async (req, res) => {
      try{
        const parcel = req.body;
        const Id = req.query.id;
        console.log(parcel, Id);
      const query = {_id: new ObjectId(Id)};
      // const options = {upsert: true};
      // const oldParcel = await parcels.findOne(query);
      const updateParcel = await parcels.updateOne(query,{
          $set: {...parcel}
        });
      res.send(updateParcel);
      } catch (err) {
        console.log(err);
      }})
      
      // API for canceling a parcel data
    app.patch('/cancelParcel', async (req, res) => {
      const id = req.query.id;
      const query = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const result = await parcels.updateOne(query,{
          $set: {status: 'Canceled'},
        }, options);
        return res.send(result);
      });
      
      

    // API for getting the parcels of a user
    app.get('/getParcels', async (req, res) => {
      const email = req.query.email;
      const page = req.query.page;
      const pageNumber = parseInt(page);
      const perPage = 5;
      const skip = pageNumber * perPage;
      const query = {email: email};
      // const cursor = await parcels.find(query);
      const allParcels = parcels.find(query).toArray();
      const currentPageItems = await parcels.find(query).skip(skip).limit(perPage).toArray();
      const parcelsCount = await parcels.countDocuments(query);
      console.log(allParcels, parcelsCount);
      res.send({currentPageItems, parcelsCount});
    });

    // API for getting all users data
    app.get('/allParcels', async (req, res) => {
      const page = req.query.page;
      const pageNumber = parseInt(page);
      const perPage = 5;
      const skip = pageNumber * perPage;
      const cursor = await parcels.find();
      const allParcels = await cursor.skip(skip).limit(perPage).toArray();
      const parcelsCount = await parcels.countDocuments();
      res.send({allParcels, parcelsCount});
    });

    // ============= Reviews API ===============
    // ===== API for adding a review
    app.post('/addreview', async (req, res) => {
      const review = req.body;
      const result = await reviews.insertOne(review);
      res.send(result)
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