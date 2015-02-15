var argv = require('minimist')(process.argv.slice(2));

var options = {};
options.host = argv.host || 'localhost';
options.port = argv.port || 28015;
options.silent = true;
var r = require('rethinkdbdash')(options);

var fs = require('fs');
var split = require('split');

// Handler for errors
function _handleError(error) {
  console.error('An error happened during the export operation:');
  console.error('  '+error.message);
  process.exit(1);
}

// Import the file in the table
function _import(file, db, table, cb) {
  console.log('Importing file '+file);
  fs.createReadStream(file)
    .on('error', _handleError)
    .pipe(split(JSON.parse))
    .on('error', _handleError)
    .pipe(r.db(db).table(table).toStream({writable: true}))
    .on('finish', cb);
}

// Create the table if needed
function _createTables(files, cb, index) {
  index = index | 0;
  if (index < files.length) {
    var file = files[index].file;
    var db = files[index].db;
    var table = files[index].table;

    r.branch(
      r.dbList().contains(db),
      {dbs_created: 1},
      r.dbCreate(db)
    ).do(function() {
      return r.db(db).tableCreate(table)
    }).run().then(function(result) {

      _import(file, db, table, function() {
        index++;
        _createTables(files, cb, index);
      });

    }).error(_handleError);
  }
  else {
    cb();
  }

}

// Read all the files from the directory and make sure they match the format `db.table.txt`
function _readDir(dir) {
  try {
    var fileNames = fs.readdirSync(dir);
    var files = [];
    for(var i=0; i<fileNames.length; i++) {
      var data = fileNames[i].split('.');
      if ((data.length !== 3) || (data[2] !== 'txt')) {
        _handleError(new Error('The file '+fileNames[i]+' did not match the expected format `db.table.txt`'));
      }
      files.push({
        db: data[0],
        table: data[1],
        file: dir+'/'+fileNames[i]
      })
    }
    _createTables(files, _done);
  }
  catch(err) {
    _handleError(err);
  }
}

// Final handler, purge the pool and print 'Done'
function _done() {
  r.getPool().drain();
  console.log('Done.');
}

function _help() {
  console.log('Import the data to your RethinkDB instance.')
  console.log('This is an example for rethinkdbdash. Use `rethinkdb import` for faster imports.');
  console.log('');
  console.log('Optional arguments are');
  console.log('  --help              Print this help');
  console.log('  --host host         Host of the rethinkdb instance to connect to.');
  console.log('                      Default `localhost`');
  console.log('  --port port         Driver port of the rethinkdb instance');
  console.log('                      Default 28015');
  console.log('  --dir               Directory to read the files from');
  console.log('                      By default the script will try to import from a directory that match `data...`');

  process.exit(0);
}

// Main function
function _main() {
  if (argv.help != null) {
    _help();
  }

  if (argv.dir != null) {
    console.log('Importing files from '+argv.dir);
    _readDir(argv.dir, _done)
  }
  else {
    console.log('No importing dir specified, trying to find one...');
    var dirs = [];
    try {
      var allFiles = fs.readdirSync(__dirname);
      for(var i=0; i<allFiles.length ;i++) {
        if ((/^data/.test(allFiles[i]) && fs.statSync(allFiles[i]).isDirectory())) {
          dirs.push(allFiles[i]);
        }
      }
      if (dirs.length > 0) {
        dirs.sort();
        var dir = dirs[dirs.length-1];
        console.log('Importing files from '+dir);
        _readDir(dir, _done);
      }
      else {
        console.log('Could not find any directories starting with `data`.');
        process.exit(1);
      }
    }
    catch(err) {
      _handleError(err);
    }
  }
}

_main();
