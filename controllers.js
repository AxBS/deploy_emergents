const db = require('./myStorage');
const underscore = require('underscore')

let DB = new db.myDB('./data');

const mng = require("mongoose");
const my_conn_data = "mongodb://alexbeltran:alexbeltran@ds117200.mlab.com:17200/mydb";

mng.connect(my_conn_data).catch(err => {
    console.log("mongoose: ", err.message);
});


var TweetModel = mng.model("Tweet", 
    new mng.Schema({
    identifier: { type: String, index: true },
    agent: {
        "@type": String,
        name: String,
    },
    startTime: String,
    "@context": String,
    "@type": String,
    query: String,
    url: String,
}));

exports.sendStatic = (req, res) => res.sendFile("public/index.html", { root: application_root });

exports.sendDatasets = (req, res) => res.send({ result: DB.getDatasets() });

exports.sendCounts = (req, res) => {
    let counts = DB.getCounts();
    let result = [];
    for (var c in counts) {
        result.push([c, counts[c]]);
    }
    res.send(JSON.stringify({ result: result }));
}

exports.sendLastPosts = (req, res) => {
    let n = (req.query.n == null) ? 10 : parseInt(req.query.n);
    DB.getLastObjects(req.params.name, n, data => res.send(data));
};

//pon aqui tus funciones adicionales!

//Exercise 3
exports.getTweetsByPolarity = (req, res) => {
    let name = req.params.name

    DB.getLastObjects(name, 100, tweets => {
        let positive = 0
        let negative = 0
        let neutral = 0
        tweets = tweets.result;

        for (let tweet of tweets) {
            if (tweet.sentiment > 0) {
                positive++
            } else if (tweet.sentiment < 0) {
                negative++
            } else {
                neutral++
            }
        }

        var result = { "positive": positive, "negative": negative, "neutral": neutral }
        console.log(result)
        res.send(JSON.stringify({ result: result }))
    })
}

exports.createStream = (req, res) => {
    //El JSON que recibimos viene en el Body de la request. Dentro del body cogemos la variable name.
    let name = req.body.name.trim()
    let track = req.body.track;
    const stream = require("./myStream.js");
    let myStream = new stream.MyStream();
    myStream.createStream(name, track);
    setTimeot(_ => myStream.destroyStream(name), 2000);
    res.json({result:"El stream ha sigo creado de forma correcta!"}) //Combinación de json.stringify y res.send
}

exports.newStreamJSONLD =  (req, res) => {
    let name = req.body.name.trim()
    let track = req.body.track;

    let jsonld = {
        "@context": "http://schema.org",
        "@type": "SearchAction",
        identifier: name,
        startTime: new Date().toISOString(),
        query: track,
        agent: {
            "@type": "Person",
            name: "CryptoGod Manager",
        },
        url: "http://localhost:8080/stream/" + name, //Dónde se puede acceder al stream
    };

    //Saving data en mongoose 
    new TweetModel(jsonld).save().catch(err => console.log(err.message));


    const stream = require("./myStream.js");
    let myStream = new stream.MyStream();
    myStream.createStream(name, track, jsonld);
    setTimeout(_ => myStream.destroyStream(name), 2000);
    res.json({result:"exito"}) //Combinación de json.stringify y res.send
}

exports.getGraph = (req, res) => {
    TweetModel.find({}).then(function(queryResult){
        let jsonld = {
            "@context": "http://schema.org",
            "@type": "ItemList",
            "@url": "http://localhost:8080/stream/graph",
            name: "JsonLD Graph",
            description: "List containing a description of each of the streams",
            itemListElement: queryResult.map(function(element, index){
                return { "@type": "ItemList",item: element,position: index + 1};
            }),
        };
        res.json(jsonld);
    });
};

exports.getTopWords = (req, res) => {
    let name = req.params.name
    DB.getLastObjects(name, 50, data => {
        let numWords = req.query.top
        let todas = [];


        let tweets = data.result;

        for (let i = 0; i < tweets.length; i++) {
            todas.push(...tweets[i].text.split(" "))
        }
        let words = underscore.countBy(todas);
        let pares = underscore.pairs(words);
        pares = underscore.sortBy(pares, x => -x[1]);

        pares = pares.slice(0, numWords)
        res.send(JSON.stringify({ result: pares }))
    })
}

exports.getTweetsGeo = (req, res) => {
    let name = req.params.name
    //Passing a 0 indicates all the elements contained in the stream
    DB.getLastObjects(name, 0, data => {
        let map = []

        let tweets = data.result;

        result = tweets.filter(tweet => tweet.coordinates != null).map((tweet => {
            let res = {}
            res[tweet.id] = tweet.coordinates.coordinates
            return res
        }));
        console.log(result)
        res.send(JSON.stringify({ result: result }))
    })
}

exports.warmup = DB.events;