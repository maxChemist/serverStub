const express = require('express');
const cors = require('cors');

const useRouter = require('./routes/user.routes');

const app = express();

app.use(cors());
// app.use(express.json());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use("/", useRouter)

const server = require("http").createServer(app)

const PORT = 7000

async function start(){
    try {
        server.listen(PORT,()=>{
            console.log("Server start at ",PORT)
        })
    }catch(err){
        console.log("Server error: ",err)
    }
}

start()
