var express      = require('express'),
	fs           = require('fs'),
    bodyParser   = require('body-parser'),
    vars         = require("./build-vars"),
    request      = require('request');


var options = {
    cert: fs.readFileSync('cert/cert.pem'),
    key: fs.readFileSync('cert/key.key'),
    requestCert: false,
    rejectUnauthorized: false
};

var app      = express(),
	https    = require('https').createServer(options, app);

https.listen(vars.PORT);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var queue = [];

app.post(vars.WEBHOOK_URL, function(req, res) {
	var json = {};
    var message = req.body.message;

    var data = {};
    data.chat_id = message.chat.id;
    json.method = "sendChatAction";
    json.action = "typing";
    res.json(json);

    if(message.text == undefined || ['/start'].indexOf(message.text) == -1) {
    	queue.push([data, 'sticker', 'BQADBQADIwADw20RBDWi8t98s12bAg']);
    	queue.push([data, 'message', "I don't know what you are trying to do here," +
    							     "but anyways... Here's your user id:", false]);
    } else {
    	queue.push([data, 'message', "Hey there! Here's your user id:", false]);
    }
    queue.push([data, 'message', message.from.id, false]);
    sendQueue();
});


function sendSticker(_data, sticker) {
	var data = JSON.parse(JSON.stringify(_data));
    data.sticker = sticker;

    request.post({
    	url: "https://api.telegram.org/bot" + vars.BOT_TOKEN + "/sendSticker",
        formData: data
        }, function (err, res, body) {
            sendQueue();
    });
}

function sendMessage(_data, text, markdown) {
	var data = JSON.parse(JSON.stringify(_data));
    data.text = text;

    if(markdown){
        data.parse_mode = "Markdown";
    }
    request.post({
        url: "https://api.telegram.org/bot" + vars.BOT_TOKEN + "/sendMessage",
        formData: data
        }, function (err, res, body) {
            sendQueue();
    });
}

function sendQueue() {
	if(queue.length > 0) {
		var el = queue.shift();
		if(el[1] == 'sticker') {
			sendSticker(el[0], el[2]);
		} else if(el[1] == 'message') {
			sendMessage(el[0], el[2], el[3]);
		}
	}
}

