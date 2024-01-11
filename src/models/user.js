const mongoose = require('mongoose')
const isEmail = require('validator/lib/isEmail')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const task = require('./task')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) throw new Error("Age must be a  positive number");
      },
    },
    email: {
      type: String,
      required: true,
      unique:true,
      trim: true,
      validate(val) {
        if (!isEmail(val)) {
          throw new Error("Not a valid Email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 7,
      validate(val) {
        if (val.toLowerCase().includes("password")) {
          throw new Error('Password cannot be "password"');
        }
      },
    },
    tokens:[{
      token:{
        type:String,
        required:true
      }
    }],
    avatar:{
      type:Buffer
    }
  },{timestamps:true}
  );
// A virtual poperty for userSchema to store logical connection between User model and Task model
// Not stored in database, only exists in runtime
  userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'ownedBy'
  })

  
  userSchema.methods.toJSON =  function(){
    const user = this
    const userObj = user.toObject()
    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar

    return userObj
  }

  userSchema.methods.genAuthToken = async function(){
    const user = this
    const token = jwt.sign({'_id':user._id},process.env.JWT_STRING)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
  }
  userSchema.statics.findByEmail = async (email,password)=>{
    const user = await User.findOne({email})
    if(!user){
      throw new Error('user does not exist')
  }
  
    const match = await bcrypt.compare(password,user.password)
  
  if(!match){
    throw new Error('Incorrect password')
  }
  return user
}


  userSchema.pre('save',async function(next){
    const user = this
    if(user.isModified('password')){
      user.password = await bcrypt.hash(user.password,8)
    }
    next()
  })

  userSchema.pre('remove', async function(next){
    const user = this
    await task.deleteMany({ownedBy:user._id})
    next()
  })
  const User = mongoose.model('User',userSchema)

  module.exports = User
  