var express = require('express');
var path = require('path');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
var base58 = require('./base58.js');
var Url = require('./models/url');


var app = express();

app.use(express.static(path.join(__dirname,'public')))
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.get('/',function(req,res){
    //route to serve the homepage which is index.html
    res.sendFile(path.join(__dirname,'views/index.html'));
})


app.post('/api/shorten',function(req,res){
    //route to create and return a shortened URL given a long URL
    var longUrl = req.body.url;
    var shortUrl = '';
  
    // check if url already exists in database
    Url.findOne({long_url: longUrl}, function (err, doc){
      if (doc){
        // base58 encode the unique _id of that document and construct the short URL
        shortUrl = config.webhost + base58.encode(doc._id);
  
        // since the document exists, we return it without creating a new entry
        res.send({'shortUrl': shortUrl});
      } else {
        // The long URL was not found in the long_url field in our urls
        // collection, so we need to create a new entry:
        var newUrl = Url({
          long_url: longUrl
        });
  
        // save the new link
        newUrl.save(function(err) {
          if (err){
            console.log(err);
          }
  
          // construct the short URL
          shortUrl = config.webhost + base58.encode(newUrl._id);
  
          res.send({'shortUrl': shortUrl});
        });
      }
  
    });
  
})

app.get('/:encoded_id',function(req,res){
    //route to redirect to their original URL given the short URL
    var base58Id = req.params.encoded_id;
    var id = base58.decode(base58Id);
  
    // check if url already exists in database
    Url.findOne({_id: id}, function (err, doc){
      if (doc) {
        // found an entry in the DB, redirect the user to their destination
        res.redirect(doc.long_url);
      } else {
        // nothing found, take 'em home
        res.redirect(config.webhost);
      }
    });
})

app.listen(3000,function(){
    console.log('Server is running')
})