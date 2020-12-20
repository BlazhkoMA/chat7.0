const consola = require('consola')
const {Nuxt, Builder} = require('nuxt')
const {app, server} = require('./app')
const users = require('./users')()
const io = require('socket.io')(server)
//get nuxt config
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
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
    socket.on('userJoined', (data, cb) => {
      if(!data.name || !data.room){
        return cb('Access Denied')
      }
      socket.join(data.room)
      users.remove(socket.id)
      users.add({
        id: socket.id,
        name: data.name,
        room:data.room
      })
      cb({
        userId: socket.id
      })

      io.to(data.room).emit('updateUsers', users.getByRoom(data.room))

      socket.emit('newMessage', m('admin', `Welcome ${data.name}`))
      socket.broadcast
        .to(data.room)
        .emit('newMessage', m('admin', `User ${data.name} joined`))
    })
    socket.on('newConnection', (connectionID, roomID) => {
      socket.join(roomID)
      socket.broadcast
        .to(roomID)
        .emit('newUserConnected', connectionID)
    })
    socket.on('createMessage', (data,cb) => {
      if(!data.text){
        return cb('text not be empty')
      }
      const user = users.get(data.id)
      if(user) {
        io.to(user.room).emit('newMessage', m(user.name, data.text, data.id))
      }
      cb()
    })
    socket.on('userLeft', (id, cb) => {
      const user = users.remove(id)
      if(user) {
        io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
        io.to(user.room).emit('newMessage', m('admin', `User ${user.name} left`))
      }
      cb()
    })
    socket.on('disconnect', () => {
      const user = users.remove(socket.id)
      if(user) {
        io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
        io.to(user.room).emit('newMessage', m('admin', `User ${user.name} left`))
      }
    })
  })

}
start()
