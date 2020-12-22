const consola = require('consola')
const {Nuxt, Builder} = require('nuxt')
const {app, server, mongoose} = require('./app')
const urlMongo = 'mongodb+srv://Mikhail:XY74xbN0zd3vZMFP@cluster0.eeaz7.mongodb.net/chat?retryWrites=true&w=majority'
const users = require('./users')()
const io = require('socket.io')(server)
const {Schema, model} = require('mongoose')

const db = new Schema({
  roomId: {
    type: String,
    required: true
  },
  users: {
    type: Array,
    required: true
  },
  messages: {
    type: Array
  }
})
const DB = model('Db', db)
//get nuxt config
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
  try {
    await mongoose.connect(urlMongo, {useNewUrlParser: true})
  } catch (e){
  }

  //nuxt init
  const nuxt = new Nuxt(config)
  //get server option from nuxt.config.js
  const { host, port } = nuxt.options.server
  //check production mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  //add nuxt render to app
  app.use(nuxt.render)
  server.listen(3000, () => {
    consola.ready({
      message: `Server listening on http://${host}:${port}`,
      badge: true
    })
  })

  const {m} = require('./server_func')
  io.on('connection', socket => {
    socket.on('userJoined', async (data, cb) => {


      const roomId = await DB.findOne({roomId: data.room})
      if(!roomId){
        console.log('room not find')
        return cb('Access Denied')
      } else {
        const userLocal = users.checkInside(data.name, data.room)
        if(userLocal === undefined){
          const userDb =  await DB.findOne({users: {"$in": data.name}})
          if(!userDb && !userLocal){
            console.log('user not find ')
            return cb('Access Denied')
          } else {
            console.log('user find, Welcome')
          }
        } else {
          console.log('user is connected')
          return cb('Access Denied')
        }

      }
      socket.join(data.room)
      users.remove(socket.id)
      users.add({
        id: socket.id,
        name: data.name,
        room: data.room,
        peer: data.peer,
        showVideo: false,
      })
      const object = await DB.findOne({roomId: data.room})
      io.to(data.room).emit('initMessages', object.messages)
      console.log('User Joined: ', data.peer)
      cb({
        userId: socket.id
      })

      io.to(data.room).emit('updateUsers', users.getByRoom(data.room))

      socket.emit('newMessage', m('admin', `Welcome ${data.name}`, new Date()))
      socket.broadcast
        .to(data.room)
        .emit('newMessage', m('admin', `User ${data.name} joined`, new Date()))
    })



    socket.on('userShowVideo', (data) => {
      console.log(data.name + ' Started to show video')
      socket.broadcast
        .to(data.room)
        .emit('stopRemoteVideoShow', data.peer)
    })
    socket.on('userStopShowVideo', (data) => {
      console.log(data.name + ' Stopped to show video')
      socket.broadcast
        .to(data.room)
        .emit('stopRemoteVideoShow', data.peer)
    })
    socket.on('userConnectToRoom', (data) => {
      console.log(data.name + ' Connect to room')
      socket.broadcast
        .to(data.room)
        .emit('userConnected', data.peer)
    })



    socket.on('createMessage', async (data,cb) => {
      if(!data.text){
        return cb('text not be empty')
      }
      const user = users.get(data.id)
      const message = {
        time: new Date(),
        text: data.text,
        user: user.name,
      }
      await DB.updateOne(
        { roomId: user.room },
        { $push: { messages: message } },
      );
      if(user) {
        io.to(user.room).emit('newMessage', m(user.name, data.text, data.id))
      }
      cb()
    })
    socket.on('userLeft', (id, cb) => {
      const user = users.remove(id)
      if(user) {
        socket.join(user.room)
        socket.broadcast.to(user.room).emit('disconnectUser', user.peer)
        io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
        io.to(user.room).emit('newMessage', m('admin', `User ${user.name} left`, new Date()))
      }
      cb()
    })
    socket.on('disconnect', () => {
      const user = users.remove(socket.id)
      if(user) {

        socket.join(user.room)
        socket.broadcast.to(user.room).emit('disconnectUser', user.peer)


        io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
        io.to(user.room).emit('newMessage', m('admin', `User ${user.name} left`, new Date()))
      }
    })
  })

}
start()
