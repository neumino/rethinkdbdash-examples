var Bluebird = require('bluebird');
var config = require('./config');
var r = require('rethinkdbdash')(config.rethinkdb);

Bluebird.coroutine(function* () {
    try{
        yield r.dbCreate("dashex");
        console.log("Database `dashex` created");

        yield r.db("dashex").tableCreate("todo");
        console.log("Table `todo` created");

        yield r.db("dashex").table("todo").indexCreate("createdAt");
        console.log("Index `createdAt` created.");
    }
    catch(e) {
        console.log(e.message);
        console.log(e);
    }
    yield r.getPool().drain();
})();

