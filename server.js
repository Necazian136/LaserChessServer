'use strict';

const express = require('express');
const {Server} = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
    .use((req, res) => res.sendFile(INDEX, {root: __dirname}))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({server});

let lobbies = [];

wss.on('connection', (ws) => {
    let isEmpty = true;
    for (let key in lobbies) {
        if (lobbies[key]['secondPlayer'] === null && lobbies[key]['firstPlayer'] !== null) {
            lobbies[key]['secondPlayer'] = ws;
            isEmpty = false;

            let color = getRandomInt(2);
            console.log(color);

            lobbies[key]['firstPlayer'].send('c;' + color);
            lobbies[key]['secondPlayer'].send('c;' + (color + 1) % 2);

            ws.on('message', function (message) {
                if (lobbies[key]['firstPlayer'] !== null) {
                    lobbies[key]['firstPlayer'].send(message);
                }
            });

            ws.on('close', function () {
                if (lobbies[key]['firstPlayer'] !== null) {
                    lobbies[key]['firstPlayer'].send('closed');
                }
                lobbies[key]['secondPlayer'] = null;
            });
        }
    }

    if (isEmpty) {
        lobbies.push({'firstPlayer': ws, 'secondPlayer': null});
        let key = lobbies.length - 1;
        ws.on('message', function (message) {
            if (lobbies[key]['secondPlayer'] !== null) {
                lobbies[key]['secondPlayer'].send(message);
            }
        });
        ws.on('close', function () {
            if (lobbies[key]['secondPlayer']) {
                lobbies[key]['secondPlayer'].send('closed');
            }
            lobbies[key]['firstPlayer'] = null;
        });
    }

    for (let key in lobbies) {
        if (lobbies[key]['secondPlayer'] === null && lobbies[key]['firstPlayer'] === null) {
            delete lobbies[key];
        }
    }
});

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
