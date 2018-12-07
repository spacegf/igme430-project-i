const express = require('express');
const path = require('path');
const urban = require('urban-dictionary');
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');

const port = process.env.PORT || process.env.NODE_PORT || 3000;
// examples, defaults
const savedExpressions = [{ adj: 'aback', noun: 'anus' }, { adj: 'aback', noun: 'arsehole' }, { adj: 'abaft', noun: 'anus' }];
const app = express();

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// collegiate dictionary key, no thesaurus access
const merriamApiKey = 'b02427b8-f458-40e7-b79d-77d184fed234';

app.use(express.json()); // thank you express

app.use(express.urlencoded({
  extended: true,
}));

// Static files served from the client folder.
app.use('/assets', express.static('client'));

// Base URL
app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/../client/index.html`));
});

// Get a random noun
app.get('/nouns', (req, res) => {
  const nouns = JSON.parse(fs.readFileSync(`${__dirname}/nouns.json`));
  const nounIndex = randInt(0, nouns.noun.length);
  res.send({
    noun: nouns.noun[nounIndex],
  });
});

// Get a random adjective
app.get('/adjectives', (req, res) => {
  const adjectives = JSON.parse(fs.readFileSync(`${__dirname}/adjectives.json`));
  const adjIndex = randInt(0, adjectives.adjectives.length);
  res.send({
    adjective: adjectives.adjectives[adjIndex],
  });
});

// Urban dictionary lookup
app.get('/lookup/urban', (req, res) => {
  if (typeof req.query.word === 'undefined') {
    res.status(400).send({
      id: 'MissingParam',
      message: 'Missing "word" URL query parameter.',
    });
  } else {
    const defLimit = (typeof req.query.limit !== 'undefined') ? req.query.limit : 3;
    urban.term(req.query.word).then((result) => {
      const definitions = [];
      result.entries.forEach((entry, index) => {
        if (index < defLimit) {
          definitions.push(entry.definition);
        }
      });
      res.send({
        definition: definitions,
      });
    }).catch(() => {
      res.status(500).send({
        id: 'UrbanDictionaryError',
        message: 'Error retrieving from Urban Dictionary.',
      });
    });
  }
});

app.get('/lookup/merriam', (req, res) => {
  if (typeof req.query.word === 'undefined') {
    res.status(400).send({
      id: 'MissingParam',
      message: 'Missing "word" URL query parameter.',
    });
  } else {
    const defLimit = (typeof req.query.limit !== 'undefined') ? req.query.limit : 3;
    const query = querystring.stringify({ key: merriamApiKey });
    const { word } = req.query;
    http.get(`http://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?${query}`, (result) => {
      let jsonData = '';
      result.on('data', (buffer) => {
        jsonData += buffer;
      });

      result.on('end', () => {
        try {
          const data = JSON.parse(jsonData);
          res.send({
            definition: data[0].shortdef.slice(0, defLimit),
          });
        } catch (error) {
          res.status(500).send({
            id: 'InvalidJSON',
            message: 'Invalid JSON received from Merriam Webster API.',
          });
        }
      });
    });
    // .then((result) => {
    //   res.send({
    //     'definition': result.entries[0].definition
    //   });
    // }).catch((error) => {
    //   res.status(500).send({
    //     'id': 'UrbanDictionaryError',
    //     'message': 'Error retrieving from Urban Dictionary.'
    //   });
    // });
    // express handles this
  }
});

app.get('/insults', (req, res) => {
  let adj = '';
  let noun = '';
  if (typeof req.query.adj !== 'undefined') {
    ({ adj } = req.query);
    return;
  }
  if (typeof req.query.noun !== 'undefined') {
    ({ noun } = req.query);
    return;
  }

  if (!adj && !noun) {
    res.send(savedExpressions);
    return;
  }

  const found = savedExpressions.filter((element) => {
    if (adj && noun) {
      return element.adj === adj && element.noun === noun;
    }
    if (adj) {
      return element.adj === adj;
    }
    if (noun) {
      return element.noun === noun;
    }
    return false;
  });
  // success
  if (found) {
    res.send(found);
  } else {
    res.send([]);
  }
});
// failure
app.post('/insults', (req, res) => {
  if (req.body.adj && req.body.noun) {
    savedExpressions.push({
      adj: req.body.adj,
      noun: req.body.noun,
    });
    res.status(201).send('Insult saved successfully.');
  } else {
    res.status(400).send({
      id: 'MissingParams',
      message: 'Missing adjective or noun parameters to save.',
    });
  }
});

app.delete('/insults', (req, res) => {
  if (req.body.adj && req.body.noun) {
    const removeIndex = savedExpressions.findIndex(element => element === {
      adj: req.body.adj, noun: req.body.noun,
    });
    savedExpressions.splice(removeIndex, 1);
    res.status(204).send({});
  } else {
    res.status(400).send({
      id: 'MissingParams',
      message: 'Missing adjective or noun parameters to delete.',
    });
  }
});

// Start up web server
app.listen(port);
