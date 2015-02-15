var argv = require('minimist')(process.argv.slice(2));

var options = {};
options.host = argv.host || 'localhost';
options.port = argv.port || 28015;
options.silent = true;
var r = require('rethinkdbdash')(options);

var fs = require('fs');
var Stringify = require('streaming-json-stringify');
Stringify.prototype.open = new Buffer('', 'utf8')
Stringify.prototype.seperator = new Buffer('\n', 'utf8')
Stringify.prototype.close = new Buffer('', 'utf8')

// Define the directory where export files will be created
var now = new Date().toISOString();
var dir = 'data'+now;

// Handler for errors
function _handleError(error) {
  console.error('An error happened during the export operation:');
  console.error('  '+error.message);
  process.exit(1);
}

// Export a given a database and a table
function _export(db, table, cb) {
  console.log('Exporting '+db+'.'+table);
  r.db(db).table(table).toStream({timeFormat: 'raw', binaryFormat: 'raw'})
    .on('error', _handleError)
    .pipe(Stringify())
    .on('error', _handleError)
    .pipe(fs.createWriteStream(dir+'/'+db+'.'+table+'.txt'))
    .on('error', _handleError)
    .on('finish', cb);
}

// Export all the tables provided as {db: ..., table: ...}
function _exportAll(tables, cb, index) {
  index = index | 0;
  if (index < tables.length) {
    var db = tables[index].db;
    var table = tables[index].table;
    _export(db, table, function() {
      index++;
      _exportAll(tables, cb, index)
    });
  }
  else {
    cb();
  }
}

// Final handler, purge the pool and print 'Done'
function _done() {
  r.getPool().drain();
  console.log('Done.');
}

function _help() {
  console.log('Export the data from your RethinkDB instance.')
  console.log('This is an example for rethinkdbdash. Use `rethinkdb export` for faster imports.');
  console.log('');
  console.log('Optional arguments are');
  console.log('  --help              Print this help');
  console.log('  --host host         Host of the rethinkdb instance to connect to.');
  console.log('                      Default `localhost`');
  console.log('  --port port         Driver port of the rethinkdb instance');
  console.log('                      Default 28015');
  console.log('  --db database       Database to export');
  console.log('                      By default all the databases will be export except `rethinkdb`');
  console.log('  --table table       Table to export');
  console.log('                      By default all the table of the provided database will be exported');

  process.exit(0);
}

// Main function
function _main() {
  if (argv.help != null) {
    _help();
  }
  console.log('Creating the `data` directory...');
  try {
    fs.mkdirSync(dir)
  }
  catch(err) {
    _handleError(err);
  }
  console.log('Exporting...');

  if (argv.db != null) {
    if (argv.table != null) {
      // Export a unique table
      _export(argv.db, argv.table, _done);
    }
    else {
      // Export all the tables in the provided database
      r.db(argv.db).tableList().map(function(table) {
        return {db: argv.db, table: table};
      }).run().then(function(tables) {
        _exportAll(tables, _done);
      }).error(_handleError);
    }
  }
  else {
    // Export all the databases and tables
    r.dbList().filter(function(db) {
      return db.ne('rethinkdb') // do not export the system table
    }).concatMap(function(db) {
      return r.db(db).tableList().map(function(table) {
        return {db: db, table: table}
      })
    }).run().then(function(tables) {
      _exportAll(tables, _done);
    }).error(_handleError);
  }
}

_main();
