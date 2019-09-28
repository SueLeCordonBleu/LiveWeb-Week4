

var https = require('https');
var fs = require('fs'); // Using the filesystem module
var url = require('url');

var options = {
  key: fs.readFileSync('my-key.pem'),
  cert: fs.readFileSync('my-cert.pem')
};

function handleIt(req, res) {
  var parsedUrl = url.parse(req.url);

  var path = parsedUrl.pathname;
  if (path == "/") {
    path = "index.html";
  }

  fs.readFile(__dirname + path,

    // Callback function for reading
    function(err, fileContents) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + req.url);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200);
      res.end(fileContents);
    }
  );

  // Send a log message to the console
  console.log("Got a request " + req.url);
}

var httpServer = https.createServer(options, handleIt);
httpServer.listen(8082);

console.log('Server listening on port 8082');

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);
var streamer = false;
var audience = [];


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function(socket) {

    console.log("We have a new client: " + socket.id);

    console.log('Streamer: ' + streamer + "Audience: " + audience);

    // The first one can be the streamer
    if (audience.length < 1) {
      if (streamer == false) {
        streamer = socket.id;
        console.log('streamer is: ' + socket.id);
        socket.emit('streamer');
        //only streamer can emit images
        socket.on('image', function(data) {
          io.sockets.emit('image', data);
        });
      } else {
        audience.push(socket.id);
      }
    } else {
      let found = false;
      for (i = 0; i < audience.length; i++) {
        if (audience[i] == socket.id) {
          found = true;
        }
      }
      if (found == false) {
        audience.push(socket.id);
      }
    }

    socket.on('disconnect', function() {
      if (streamer == socket.id) {
        if(audience.length < 1) {
          streamer = false;
        } else {
          streamer = audience[0];
          audience.splice(0,1);
        }
      } else {
        audience.splice(audience.indexOf(socket.id), 1);
      }
      console.log("Client has disconnected");
    });

    socket.on('toggleLive', function() {
      console.log("Toggle to real live");
      io.sockets.emit('toggleLive');
    });

    socket.on('play', function() {
      console.log("Start to play fake video");
      io.sockets.emit('play');
    });


    socket.on('chatmessage', function(message) {
      console.log("got message: " + message);
      io.sockets.emit('chatmessage', message);
    });
  }
);
