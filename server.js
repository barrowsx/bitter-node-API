const io = require('socket.io')()
const mongo = require('mongodb').MongoClient

io.on('connection', socket => {
  console.log('a user connected')

  socket.on('create chat', (user, currentUser) => {
    let chatName = user.toString() + '_' + currentUser.toString()
    mongo.connect(MONGODB_URI, (err, db) => {
      let collection = db.collection(chatName)
      db.listCollections({name: chatName}).next((err, collInfo) => {
        if(collInfo){
          console.log('chatroom ' + chatName + ' already exists, not creating...')
          socket.emit('chat exists')
        } else {
          collection.insert({user: '', content: 'Welcome to the chat!', date: Date.now()}, (err, o) => {
            if(err){
              console.warn(err.message)
            } else {
              console.log('chatroom ' + chatName + ' created.')
            }
          })
        }
      })
    })
  })

  // socket.on('chat connect')

  mongo.connect(MONGODB_URI, (err, db) => {
    let collection = db.collection('chat messages')
    let stream = collection.find().sort({date: -1}).limit(10).stream()
    stream.on('data', chat => {
      socket.emit('chat', chat)
    })
  })

  socket.on('chat', (usr, msg, date) => {
    mongo.connect(MONGODB_URI, (err, db) => {
      let collection = db.collection('chat messages')
      collection.insert({user: usr, content: msg, date: date}, (err, o) => {
        if(err){
          console.warn(err.message)
        } else {
          console.log(usr + " chat message inserted into db: " + msg + " with timestamp " + date)
        }
      })
    })
    io.emit('chat', {user: usr, content: msg})
  })
  socket.on('disconnect', () => {
    console.log('a user disconnected')
  })
})

const port = process.env.PORT || 3002
io.listen(port)
console.log('listening on port', port)
