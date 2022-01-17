const express = require('express');
const app = express();
const PORT = process.env.PORT_THREE || 9090;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

const Order  = require('./Order');
const isAuthenticated = require('../isAuthenticated');

app.use(express.json());

mongoose.connect(
    "mongodb://localhost/order-service",
    {
        useNewUrlParser  :true,
        useUnifiedTopology  : true,
    },
    () => {
        console.log(`order-service DB connected`);
    }
)

async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");

}

function createOrder(products,userEmail){
    let tot = 0;
    for(let i=0;i<products.length;i++)
    {
        tot += products[i].price
    }
    const newOrder=  new Order({
        products,
        user: userEmail,
        total_price : tot
    })
    newOrder.save();
    return newOrder;
}


connect().then(()=> {
    channel.consume("ORDER", data => {
        const { products, userEmail} = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
        console.log("Consuming order queue");
        channel.ack(data);

        channel.sendToQueue("PRODUCT",Buffer.from(JSON.stringify({newOrder})))
    })
});




app.listen(PORT , ()=> {
    console.log(`order-service at ${PORT}`);
});