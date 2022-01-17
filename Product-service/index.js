const express = require('express');
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

const Product  = require('./Product');
const isAuthenticated = require('../isAuthenticated');

app.use(express.json());

mongoose.connect(
    "mongodb://localhost/product-service",
    {
        useNewUrlParser  :true,
        useUnifiedTopology  : true,
    },
    () => {
        console.log(`product-service DB connected`);
    }
)

async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");

}
connect();

app.post('/product/create' , isAuthenticated ,async(req,res) => {
    const { name ,description , price} = req.body;
    const newProduct  = new Product( {
        name ,
        description,
        price
    })
    newProduct.save();
    return res.json(newProduct);
});

/// user sends products id to buy
/// create an order with those products and sum of total value of order

app.post('/product/buy', isAuthenticated , async(req,res) => {
    const { ids }=  req.body;
    const products = await Product.find({ _id : { $in :ids}})
    channel.sendToQueue("ORDER" , Buffer.from(JSON.stringify({
        products,
        userEmail  :  req.user.email
    })))
    var order;

    await channel.consume("PRODUCT",async data => {

        console.log( "Consuming product queue");
        order =  await JSON.parse(data.content);
        console.log(order);
       await channel.ack(data);
      
    })
   
     setTimeout(()=>  res.json(order),1000);
   
})


app.listen(PORT , ()=> {
    console.log(`product-service at ${PORT}`);
});