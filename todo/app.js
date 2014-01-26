var app = require('koa')();

// Middleware
var serve = require('koa-static');
var parse = require('co-body');
var route = require('koa-route');
var assertTimeout = require('co-assert-timeout');

// Load config for RethinkDB and koa
var config = require(__dirname+"/config.js")

// Import rethinkdbdash
var r = require('rethinkdbdash')(config.rethinkdb);

app.use(function* (next) {
    // Each request has 5 seconds to return
    yield assertTimeout(next, '5 seconds')
})

app.use(route.get('/todo/get', get));
app.use(route.put('/todo/new', create));
app.use(route.post('/todo/update', update));
app.use(route.post('/todo/delete', del));

// Static content
app.use(serve(__dirname+'/public'));

// Retrieve all todos
function* get() {
    try{
        var cursor = yield r.table(config.table).orderBy({index: "createdAt"}).run();
        var result = yield cursor.toArray();
        this.body = JSON.stringify(result);
    }
    catch(e) {
        this.status = 500;
        this.body = e.message || require('http').STATUS_CODES[this.status];
    }
}

// Create a new todo
function* create() {
    try{
        var todo = yield parse(this);
        var result = yield r.table(config.table).insert(
            r.expr(todo).merge({
                createdAt: r.now() // The date r.now(0 gets computed on the server -- new Date() would have work fine too
            }),
            {returnVals: true}
        ).run();

        todo = result.new_val; // todo now contains the previous todo + a field `id` and `createdAt`
        this.body = JSON.stringify(todo);
    }
    catch(e) {
        this.status = 500;
        this.body = e.message || require('http').STATUS_CODES[this.status];
    }
}

// Update a todo
function* update() {
    try{
        var todo = yield parse(this);
        delete todo._saving;
        var id = todo.id;

        var result = yield r.table(config.table).get(id).update(
            {title: todo.title, completed: todo.completed}, // We just want to update these two fields
            {returnVals: true}
        ).run();

        result = result.new_val;
        this.body = JSON.stringify(result);
    }
    catch(e) {
        this.status = 500;
        this.body = e.message || require('http').STATUS_CODES[this.status];
    }
}

// Delete a todo
function* del() {
    try{
        var id = yield parse(this);
        var result = yield r.table(config.table).get(id).delete().run();
        this.body = "";
    }
    catch(e) {
        this.status = 500;
        this.body = e.message || require('http').STATUS_CODES[this.status];
    }
}

// Start koa
app.listen(config.koa.port);
console.log('listening on port '+config.koa.port);
