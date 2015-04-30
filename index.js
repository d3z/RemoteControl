(function() {

    'use strict';

    var express = require('express');
    var app = express();
    var http = require('http').Server(app);
    var io = require('socket.io')(http);

    app.use(express.static(__dirname + '/public'));

    var left = io.of('/left');
    var right = io.of('/right');

    app.get('/left', function(req, res) {
        left.emit('move', {'direction':'left'});
        res.status(200, 'OK');
    });

    app.get('/right', function(req, res) {
        right.emit('move', {'direction':'right'});
        res.status(200, 'OK');
    });

    app.get('/forward', function(req, res) {
        left.emit('move', {'direction':'forward'});
        right.emit('move', {'direction':'forward'});
        res.status(200, 'OK');
    });

    var port = process.env.RC_PORT || 5000;
    app.listen(port, function() {
        console.log('RemoteControl is listening on port', port);
    });


})();
