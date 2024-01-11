const express = require('express')
const taskRoute = express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')

//List tasks
taskRoute.get("/tasks",auth, async (req, res) => {
    const match = {}
    if(req.query.completed){
      match.completed = req.query.completed === 'true'
    }
    const sort = {}
    if(req.query.sortBy){
      const part = req.query.sortBy.split(':')
      sort[part[0]] = part[1] === 'desc' ? -1 : 1
    }

    try {
      await req.user.execPopulate({
        path:'tasks',
        match:match,
        options:{
          limit:parseInt(req.query.limit),
          skip:parseInt(req.query.skip),
          sort:sort
        }
    })
      res.send(req.user.tasks);
    } catch (error) {
      res.status(404).send(error);
    }
  });

//Find a task by id  
  taskRoute.get("/tasks/:id",auth,async (req, res) => {
    const id = req.params.id;
  
    try{
      const task = await Task.findOne({_id:id,ownedBy:req.user._id})
      if(!task){
          res.status(404).send()
      }
      res.send(task)
    
    }
      catch(error) {
        res.status(404).send(error);
      }
  });
  
//Create a task  
  taskRoute.post("/tasks",auth, async (req, res) => {
      
    const task = new Task({...req.body,ownedBy:req.user._id});
    try{
      await task.save()
      res.status(201).send(task) 
    }
    catch(error)
      { 
      res.status(404).send(error)
      }
  });
  
//Update a task  
  taskRoute.patch('/tasks/:id',auth,async (req,res)=>{
    const upd = Object.keys(req.body)
    const allowed = ['description','completed']
    const validOp = upd.every((update)=>allowed.includes(update))
    
    if(!validOp){
      return res.status(400).send('Invalid update request')
    }
  
      try{
          const task = await Task.findOne({_id:req.params.id,ownedBy:req.user._id})
          if(!task){
              res.status(404).send()
          }

          upd.forEach((update)=>task[update] = req.body[update])
          await task.save()
          res.send(task)
      }catch(error){
          res.status(500).send(error)
      }
  })
  
//Delete a task  
  taskRoute.delete('/tasks/:id',auth, async (req,res)=>{
    try{
      const task = await Task.findByIdAndDelete({_id:req.params.id,ownedBy:req.user._id})
  
      if(!task){
        return res.status(404).send('Task did not exist')
      }
      res.send(task)
    }
    catch(e){
      res.status(500).send(e)
    }
  })
  
  module.exports = taskRoute