const express = require('express');
const path = require('path');
const ud = require('urban-dictionary');
const fs = require('fs');

const port = process.env.PORT || process.env.NODE_PORT || 3000;
var app = express();

const randInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
// Static files served from the client folder.
app.use('/assets', express.static('client'));

// Base URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/../client/index.html'));
});

// Get a random noun
app.get('/nouns', (req, res) => {
  const nouns = JSON.parse(fs.readFileSync(__dirname + '/nouns.json'));
  const nounIndex = randInt(0, nouns.noun.length);
  res.send({
    'noun': nouns.noun[nounIndex]
  });
});

// Get a random adjective
app.get('/adjectives', (req, res) => {
  const adjectives = JSON.parse(fs.readFileSync(__dirname + '/adjectives.json'));
  const adjIndex = randInt(0, adjectives.adjectives.length);
  res.send({
    'adjective': adjectives.adjectives[adjIndex]
  });
});

app.get('/test', (req, res) => {
  res.send()
});

// Start up web server
app.listen(port);
