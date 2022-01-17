const express = require('express');
const app = express();
const PORT = process.env.PORT_ONE || 7070;
const mongoose = require('mongoose');
const User = require('./User');
const jwt = require('jsonwebtoken');

app.use(express.json());

mongoose.connect(
    "mongodb://localhost/auth-service",
    {
        useNewUrlParser  :true,
        useUnifiedTopology  : true,
    },
    () => {
        console.log(`Auth-service DB connected`);
    }
)

/// register
app.post('/auth/register' , async (req,res) => {
    const {email , password , name } = req.body;
    const userExists = await User.findOne({email});

    if(userExists)
    {
        return res.json({ message : "User already exists"});
    }
    else{
        const newUser = new User({
            name, 
            email,
            password
        });
        newUser.save();
        return res.json(newUser);
    }

})

app.post('/auth/login' , async(req,res) => {
    const {email, password } = req.body;
    const user = await User.findOne({email});

    if(!user)
    {
        return res.json({message : "User doesnot exist"});
    }
    else{
        const payload  = {
            name : user.name,
            email
        };
        if(user.password != password)
        {
            return res.json({ message : "Password incorrect"});
        }
        jwt.sign(payload , "secret" , (err,token) => {
            if(err)
            console.log(err);
            else{
                return res.json({ token})
            }
        })
    }
})

// login





app.listen(PORT , ()=> {
    console.log(`Auth-service at ${PORT}`);
});