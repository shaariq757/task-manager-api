const express = require('express')
const User = require('../models/user');
const auth = require('../middleware/auth');
const sharp = require('sharp')
const userRoute = new express.Router()
const multer = require('multer');
const { welcomeEmail, cancelEmail } = require('../email/account');

//Retrieve user information
userRoute.get("/users/me",auth, async (req, res) => {
    res.send(req.user)
})
  
//Create a user  
  userRoute.post("/users", async (req, res) => {
    const user = new User(req.body);
    try {
      await user.save()
      welcomeEmail(user.name,user.email)
      const token = await user.genAuthToken()
      res.status(201).send({user,token})
    } 
    catch (error) {
      res.send(error);
    }
  })

//User login  
  userRoute.post("/users/login",async (req,res)=>{
    try{
      const user = await User.findByEmail(req.body.email,req.body.password)
      const token = await user.genAuthToken()
      res.send({user,token})
    }catch(e){
      res.status(400).send(e)
    }
  })

//User logout
  userRoute.post('/users/logout',auth, async (req,res)=>{
    try{
      req.user.tokens = req.user.tokens.filter((tok)=>{
        return tok.token !== req.token
      })
      await req.user.save()
      res.send(req.user.name +' Logged out')
    }
    catch(e){
      res.status(500).send(e)
    }
  } )

//User logout everywhere  
  userRoute.post('/users/logoutAll',auth, async (req,res)=>{
    try{
      req.user.tokens = []
      await req.user.save()
      res.send(req.user.name + ' Logged out everywhere')
    }
    catch(e){
      res.status(500).send(e)
    }
  })

//Update user
  userRoute.patch('/users/me',auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowed = ['name','age','email','password']

    const isValidOp = updates.every((update)=>allowed.includes(update))
    if(!isValidOp){
      throw new Error('Invalid update request')
    }
    try{
        const user = req.user
        updates.forEach((update)=>user[update] = req.body[update])
        await user.save()
        res.send(user)
    }catch(e){
        res.status(400).send({error:e.message})
    }
})

//Delete user
  userRoute.delete('/users/me',auth, async (req,res)=>{
    try{
      await req.user.remove()   
      cancelEmail(req.user.name,req.user.email)
      res.send(req.user)
    }
    catch(e){
      res.status(500).send(e.message)
    }
  })

  const avatar = multer({
    limits:{
      fileSize:1000000
    },
    fileFilter(req,file,cb){
      if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
        return cb(new Error('Please upload an image file'))
      }
      cb(undefined,true)
    }
  })

//Find user avatar by id
  userRoute.get('/users/:id/avatar',async (req,res)=>{
    const user = await User.findById(req.params.id)
    res.set('Content-Type','image/png')
    res.send(user.avatar)
  })

//Find logged in user avatar 
  userRoute.get('/users/me/avatar',auth,async (req,res)=>{
    try{
    if(!req.user.avatar){
      throw new Error('Image missing')
    }
    res.set('Content-Type','image/png')
    res.send(req.user.avatar)
  }catch(e){
    res.status(404).send({error:e.message})
  }
  })

//Insert a picture as user avatar  
  userRoute.post('/users/me/avatar',auth,avatar.single('avatar'), async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({'width':250,'height':250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
  },(error,req,res,next)=>{
    res.status(400).send({error:error.message})
  })

//Delete a user avatar
  userRoute.delete('/users/me/avatar',auth, async (req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
  })

module.exports = userRoute