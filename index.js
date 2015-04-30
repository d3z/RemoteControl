(function() {

    'use strict';

    var express = require('express');
    var app = express();
    var http = require('http').Server(app);
    var WebSocketServer = require('ws').Server;

    app.use(express.static(__dirname + '/public'));

    var http_port = process.env.RC_HTTP_PORT || 5000;
    var ws_port = process.env.RC_WS_PORT || 5001;

    var fake_socket = {'send': function(message) { console.log(message, 'sent on fake socket'); }};

    var remotes = {'left': fake_socket, 'right': fake_socket};

    var ws_server = new WebSocketServer({port: ws_port});
    ws_server.on('connection', function(socket) {
        socket.on('message', function(message_string) {
            var message = JSON.parse(message_string);
            if (message.hasOwnProperty('register')) {
                var hand = message.register;
                if (hand === 'left' || hand === 'right') {
                    console.log('Client registered on', hand, 'side');
                    remotes[hand] = socket;
                }
                else {
                    console.log('Somone tried to register as', hand);
                }
            }
            else {
                console.log(message_string, "received and I don't know what to do with it.");
            }
        });
    });

    function send(to, data) {
        var data_string = JSON.stringify(data,null,'');
        remotes[to].send(data_string);
    }

    app.get('/left', function(req, res) {
        send('left', {'direction':'left'});
        res.status(200, 'OK');
    });

    app.get('/right', function(req, res) {
        send('right', {'direction':'right'});
        res.status(200, 'OK');
    });

    app.get('/forward', function(req, res) {
        var message = {'direction':'forward'};
        send('left', message);
        send('right', message);
        res.status(200, 'OK');
    });

    app.listen(http_port, function() {
        console.log('RemoteControl is listening on port', http_port);
    });


})();
