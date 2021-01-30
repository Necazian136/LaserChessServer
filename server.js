'use strict';

const express = require('express');
const {Server} = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
    .use((req, res) => res.sendFile(INDEX, {root: __dirname}))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({server});

let transmitter = null;
let receivers = {};
let counter = 0;

wss.on('connection', (ws) => {
    ws.on('message', function (message) {
        if (transmitter === null && message === 'transmitter') {
            transmitter = ws;
        } else if (message === 'receiver') {
            receivers[counter] = ws;
            counter++;
        } else if (transmitter !== null) {
            if (transmitter === ws) {
                for (let receiver of receivers) {
                    receiver.send(message);
                }
            } else {
                transmitter.send(message);
            }
        }
    });

    ws.on('close', function () {
        if (ws === transmitter) {
            transmitter = null;
        } else {
            for (let i in receivers) {
                let receiver = receivers[i];
                if (receiver === ws) {
                    delete receivers[i];
                }
            }
        }
    });
});
