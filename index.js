const express = require("express");
require('dotenv').config({path:'./config/dev.env'})
require("./src/db/mongoose");
const taskRoute = require("./src/routers/task");
const userRoute = require("./src/routers/user");
const app = express();

app.use(express.json());
app.use(userRoute)
app.use(taskRoute)

app.listen(process.env.PORT, () => {
  console.log(`Hello server from port ${process.env.PORT}`);
});