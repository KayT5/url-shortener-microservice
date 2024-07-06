require('dotenv').config();
const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const validUrl = require('valid-url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});
const URL = mongoose.model("URL", urlSchema);

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cors());

app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req,res) => {
  const url = req.body.url;
  const urlCode = shortId.generate();
  if(!validUrl.isWebUri(url)){
    res.json({
      error: 'invalid url'
    });
  } else {
    try{
      let findOne = await URL.findOne({original_url: url});
      if(findOne){
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });
      }
      else {
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        });
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });        
      }
    } catch(e) {
      console.error(e);
      res.status(500).json('Server error...');
    }
  }
});

app.get('/api/shorturl/:short_url?', async (req,res) => {
  try{
    const urlParams = await URL.findOne({short_url: req.params.short_url});
    if(urlParams){
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json('No URL found');
    }
  } catch(e) {
    console.error(e);
    res.status(500).json('Server error...');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
