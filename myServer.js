const application_root=__dirname,
    express = require("express"),
    path = require("path"),
    bodyparser=require("body-parser");

const ctrl = require('./controllers');

var app = express();
app.use(express.static(path.join(application_root,"public")));
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

//Cross-domain headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Exercise 4
app.get('/',ctrl.sendStatic);

app.get('/datasets',ctrl.sendDatasets);

app.get('/streams', ctrl.sendCounts);

app.get('/streams/graph', ctrl.getGraph)

app.get('/dataset/:name',ctrl.sendLastPosts);

app.get('/stream/:name/polarity',ctrl.getTweetsByPolarity);

app.get('/stream/:name/words',ctrl.getTopWords);

app.get('/stream/:name/geo',ctrl.getTweetsGeo)

app.post('/stream', ctrl.newStreamJSONLD)	

ctrl.warmup.once("warmup", _ => {
   console.log("Web server running on port 8080");
   app.listen(8080);
});

