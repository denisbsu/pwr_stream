const fs = require('fs');
const csv = require('csv-parse');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Tail = require('tail').Tail;

const FILENAME = "log.csv";

const parser = csv.parse({});
parser.on('readable', function() {
    let record;
    while ((record = parser.read()) !== null) {
        record = record.map(function(v) {
            return v.trim()});
        let ts = Date.parse(record[0] + " " + record[1])
        let from_freq = +record[2]
        let to_freq = +record[3]
        let step = +record[4]
        let num_bands = Math.round((to_freq - from_freq) / step)
        let data = record.slice(6, 6 + num_bands).map(function (v) {
            return +v;
        })
        let info = {
            ts: ts,
            from: from_freq,
            step: step,
            num_bands: num_bands,
            data: data
        }
        io.emit("data", info);
    }
});

parser.on('error', function(err){
    console.error(err.message);
});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/colormaps.js', (req, res) => {
  res.sendFile(__dirname + '/colormaps.js');
});
app.get('/chart.js', (req, res) => {
  res.sendFile(__dirname + '/chart.js');
});

let tail = new Tail(FILENAME, {
  separator: /\r|\n/, 
  useWatchFile: false, 
  fromBeginning: true
});

tail.on("line", function(data) {
  parser.write(data + "\n");
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

