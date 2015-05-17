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

    var remotes = {'left': fake_socket, 'right': fake_socket, 'controller': fake_socket};

    var ws_server = new WebSocketServer({port: ws_port});
    ws_server.on('connection', function(socket) {
        var hand;

        var message_handler = function(message_string) {
            var message = JSON.parse(message_string);
            if (message.hasOwnProperty('register')) {
                handle_registration(message);
            }
            else if (message.hasOwnProperty('unregister')) {
                handle_unregistration(message);
            }
            else {
                console.log(message_string, "received and I don't know what to do with it.");
            }
        };

        var controller_message_handler = function(message_string) {
            var message = JSON.parse(message_string);
            if (message.hasOwnProperty('move')) {
                var direction = message.move;
                if (direction === 'left') {
                    turn_left();
                }
                else if (direction === 'right') {
                    turn_right();
                }
                else if (direction === 'forward') {
                    move_forward();
                }
                else {
                    console.log(direction, "is not a direction I understand");
                }
            }
            else {
                console.log(message_string, "is not a control message I understand");
            }
        };

        function handle_registration(message) {
            hand = message.register;
            if (hand === 'left' || hand === 'right') {
                console.log('Client registered on', hand, 'side');
                remotes[hand] = socket;
                send('controller', {registration: hand});
            }
            else if (hand === 'controller') {
                handle_controller_registration();
            }
            else {
                console.log('Somone tried to register as', hand);
            }
        }

        function handle_unregistration(message) {
            var hand = message.unregister;
            if (hand === 'left' || hand === 'right') {
                console.log('Client unregistered on', hand, 'side');
                remotes[hand] = fake_socket;
                send('controller', {unregistration: hand});
            }
            else if (hand === 'controller') {
                console.log('Controller unregistered');
                remotes['controller'] = fake_socket;
            }
        }

        function handle_controller_registration() {
            socket.removeListener('message', message_handler);
            socket.on('message', controller_message_handler);
            remotes['controller'] = socket;
            console.log('controller registered');
            if (remotes['left'] !== fake_socket) {
                send('controller', {registration:'left'});
            }
            if (remotes['right'] !== fake_socket) {
                send('controller', {registration:'right'});
            }
        }

        socket.on('message', message_handler);

        socket.on('close', function(socket) {
            console.log(hand, 'client unregistered');
            remotes[hand] = fake_socket;
            send('controller', {'unregistration': hand});
        });
    });

    function send(to, data) {
        var data_string = JSON.stringify(data,null,'');
        remotes[to].send(data_string);
    }

    function turn_left() {
        send('left', {'move':'left'});
    }

    function turn_right() {
        send('right', {'move':'right'});
    }

    function move_forward() {
        var message = {'move':'forward'};
        send('left', message);
        send('right', message);
    }

    app.get('/left', function(req, res) {
        move_left();
        res.status(200).send('OK');
    });

    app.get('/right', function(req, res) {
        turn_right();
        res.status(200).send('OK');
    });

    app.get('/forward', function(req, res) {
        move_forward();
        res.status(200).send('OK');
    });

    app.listen(http_port, function() {
        console.log('RemoteControl is listening on port', http_port);
    });


})();
