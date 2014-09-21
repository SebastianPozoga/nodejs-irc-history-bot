
var fs, irc, client, channel, sqlite3, db, dbExist, channel,
        dbConnectData, config, erroLog, msgLog;

//init modules
fs = require('fs');
irc = require("irc");
sqlite3 = require('sqlite3').verbose();

//connfig
config = {
    db: "irc.db",
    host: "chat.freenode.net",
    port: 6667,
    identity: "__nigmalabs_org",
    channel: "#nigmalabs"
}

//overload by attributes
process.argv.forEach(function(source, index, array) {
    if (index >= 2) {
        var parts = source.spilt("=", 2);
        config[parts[0]] = parts[1];
        console.log("Set config param " + parts[0] +
                " ( at " + (index - 1) + ' attribiute) to: ' + parts[1]);
    }
});

//
dbConncetData = {
    autoConnect: true,
    connection: {
        host: config.host,
        port: config.port
    },
    identity: {
        nickname: config.identity
    },
    channels: [config.channel],
    debug: true
};

//helpers
erroLog = function(errorMsg) {
    var msg = '\n' + errorMsg + '\n';
    console.log('\n\n~~~ Error log: ' + errorMsg + '\n\n');
    fs.appendFileSync('errors.log', msg);
}
msgLog = function(masg) {
    var msg = '\n ' + masg + '\n';
    console.log(msg);
    fs.appendFileSync('msgs.log', msg);
}

//open database
dbExist = fs.existsSync(config.db);
db = new sqlite3.Database(config.db);

if (!dbExist)
    db.serialize(function() {
        db.run("CREATE TABLE meassages (nickname TEXT, msg TEXT, time INTEGER)");
        db.run("CREATE TABLE logs (msg TEXT, time INTEGER)");
    });


//irc open connection
client = new irc.Client('chat.freenode.net', process.env.OPENSHIFT_APP_NAME || config.identity, dbConncetData);
console.log(dbConncetData);

/*client.connect(function() {
    msgLog("\n\n~~~IRC Connected~~~\n\n");
});*/

if (!client) {
    erroLog("no client init");
    process.exit(1);
}

/*channel = client.join(config.channel);
 
 if (!channel) {
 erroLog("no connect to chanel");
 process.exit(1);
 }*/

client.on("message", function(nick, to, text, msg) {
    msgLog(text);
    db.serialize(function() {
        var now, stmt;
        now = new Date();
        stmt = db.prepare("INSERT INTO meassages VALUES (?,?,?)");
        stmt.run(msg.nickname, msg.text, now.getTime());
        stmt.finalize();
    });
});

client.on("join", function(joinChannel, who) {
    // Welcome them in!
    msgLog("### welcome '" + who + "' on channel" + joinChannel);
});

client.on("notice", function(nick, to, text, message) {
    msgLog("### '" + text + " (" + nick + " to " + to + ")");
});


client.on("registered", function() {
    msgLog("### register to server success");
});

msgLog("Start app");

//db.close();