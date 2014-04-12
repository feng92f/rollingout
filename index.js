#!/usr/bin/env node
'use strict';

var express = require('express');
var fs      = require('fs');
var app     = express();
var config  = require('config');

var www_path,index,index_path;

www_path = __dirname + '/www';

if(process.env.NODE_ENV == 'production'){
  index_path = www_path + '/build'
}else{
  process.env.NODE_ENV = 'testing'
  index_path = www_path + '/src'
}

try{
  index = fs.readFileSync(index_path + '/index.html');
}catch(e){
  console.log('can`t find index file from',index_path);
}

//watch the index files
//
fs.watchFile(index_path + '/index.html', function (curr, prev) {
  console.log('index file changed');
  index = fs.readFileSync(index_path + '/index.html');
});




app.configure(function(){

  app.set('view engine', 'ejs');
  app.set('views', __dirname+'/views');

  app.locals.layout = false;
  app.locals.open = '<#';
  app.locals.close = '#>';

  app.use(express.responseTime());
  app.use(express.limit('0.5mb'));
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());

  app.use(express.session({secret: 'RGDUS(CKDJFY', cookie: { maxAge:60 * 24 * 3600 * 1000 }}));
  app.use(app.router);

  app.use(express['static'](www_path));

});



app.get('/', function(req, res){
  //disable cache-control
  //serve index.html
  res.contentType('text/html');
  res.end(index);
});

process.addListener('uncaughtException', function (err, stack) {
  var message = 'Caught exception: ' + err + '\n' + err.stack;
  console.log('info', message);
});

app.listen(config.web.port,function(){
  console.log('server listen on: ',config.web.port);
  console.log('env : ', process.env.NODE_ENV);
  console.log('path: ', www_path);
});
