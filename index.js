// Setup basic express server
var express = require('express')
var app = express()
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 3001;
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/myproject';

// Use connect method to connect to the server
MongoClient.connect(url, function (err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  //记录在线用户
  const userOnline = new Map()
  io.on('connection', (socket) => {
    const userDB = db.collection('users');
    //用户注册
    socket.on('register', async ({ username, password }) => {
      //判断昵称是否已被注册
      /* console.log(await userDB.find({}).toArray()) */
      if (await userDB.findOne({ username })) {
        socket.emit('register', { msg: '用户名已存在' })
      } else {
        userDB.insertOne({ username, password })
        socket.emit('register', { type: 'success', msg: '注册成功' })
      }
    })
    //用户登录
    socket.on('login', async ({ username, password }) => {
      //获取数据库中对应用户名的数据
      const userInfo = await userDB.findOne({ username })
      //如果用户存在并且密码正确就允许登录
      if (userInfo && userInfo.password === password) {
        socket.name = username
        userOnline.set(username, socket)
        socket.emit('login', { msg: 'success' })
        const userList = []
        for (let key of userOnline.keys()) {
          userList.push(key)
        }
        socket.emit('userOnline', userList)
      }
      //如果对应的数据不存在数据库中
      else if (userInfo === undefined) {
        socket.emit('login', { msg: '用户名密码错误' })
      } else {
        socket.emit('login', { msg: '用户名密码错误' })
      }
    })
    //用户离开
    socket.on('disconnect', () => {
      userOnline.delete(socket.name)
    })
  })
  /*   db.close(); */
});


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

/* // Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
}); */
