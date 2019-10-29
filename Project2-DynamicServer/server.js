// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));



// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        var total_coal = 0;
        var total_natural_gas = 0;
        var total_nuclear_count = 0;
        var total_petroleum_count = 0;
        var total_renewable_count = 0;

        db.all("SELECT * FROM Consumption WHERE year = ?", ["2017"], (err, rows) => {
            
            for (var i = 0; i < rows.length; i++) 
            {
                total_coal = total_coal + rows[i].coal;
                total_natural_gas = total_natural_gas + rows[i].natural_gas;
                total_nuclear_count = total_nuclear_count + rows[i].nuclear;
                total_petroleum_count = total_petroleum_count + rows[i].petroleum;
                total_renewable_count = total_renewable_count + rows[i].renewable;
            }

            response = response.replace('var coal_count', 'var coal_count = ' + total_coal.toString());
            response = response.replace('var natural_gas_count', 'var natural_gas_count = ' + total_natural_gas.toString());
            response = response.replace('var nuclear_count', 'var nuclear_count = ' + total_nuclear_count.toString());
            response = response.replace('var petroleum_count', 'var petroleum_count = ' + total_petroleum_count.toString());
            response = response.replace('var renewable_count', 'var renewable_count = ' + total_renewable_count.toString());

            db.all("SELECT * FROM Consumption WHERE year = ?", ["2017"], (err, rows) => {
                var coalData = '';
                var gasData = '';
                var nuclearData = '';
                var petroleumData = '';
                var renewableData = '';
                var tableResult = '';
                for(var i = 0; i < rows.length; i++)
                {
                    coalData = rows[i].coal;
                    coalData = coalData.toString();
                    gasData = rows[i].natural_gas;
                    gasData = gasData.toString();
                    nuclearData = rows[i].nuclear;
                    nuclearData = nuclearData.toString();
                    petroleumData = rows[i].petroleum;
                    petroleumData = petroleumData.toString();
                    renewableData = rows[i].renewable;
                    renewableData = renewableData.toString();

                    tableResult = tableResult + '<tr><td>' + rows[i].state_abbreviation + '</td>' + '\n' + '<td>' + coalData + '</td>' +
                                '\n' + '<td>' + gasData + '</td>' + '\n' + '<td>' + nuclearData + '</td>' + '\n' + '<td>' +
                                petroleumData + '</td>' + '\n' + '<td>' + renewableData + '</td></tr>';
                }
                response = response.replace('<td>tableData</td>', tableResult);
                WriteHtml(res, response);
            });
            
        });
        // db.all for populating table
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify response here
        var total_coal = 0;
        var total_natural_gas = 0;
        var total_nuclear_count = 0;
        var total_petroleum_count = 0;
        var total_renewable_count = 0;
        var yearSelected = ''
        yearSelected = req.params.selected_year;
        // populate year header
        response = response.replace('National Snapshot', yearSelected + ' National Snapshot');
        response = response.replace('var year', 'var year = ' + req.params.selected_year);

        
        db.all('SELECT * FROM Consumption WHERE year = ?', [yearSelected], (err, rows) => {
            for (var i = 0; i < rows.length; i++) 
            {
                total_coal = total_coal + rows[i].coal;
                total_natural_gas = total_natural_gas + rows[i].natural_gas;
                total_nuclear_count = total_nuclear_count + rows[i].nuclear;
                total_petroleum_count = total_petroleum_count + rows[i].petroleum;
                total_renewable_count = total_renewable_count + rows[i].renewable;
            }
            response = response.replace('var coal_count', 'var coal_count = ' + total_coal.toString());
            response = response.replace('var natural_gas_count', 'var natural_gas_count = ' + total_natural_gas.toString());
            response = response.replace('var nuclear_count', 'var nuclear_count = ' + total_nuclear_count.toString());
            response = response.replace('var petroleum_count', 'var petroleum_count = ' + total_petroleum_count.toString());
            response = response.replace('var renewable_count', 'var renewable_count = ' + total_renewable_count.toString());
            db.all("SELECT * FROM Consumption WHERE year = ?", [yearSelected], (err, rows) => {
                var coalData = '';
                var gasData = '';
                var nuclearData = '';
                var petroleumData = '';
                var renewableData = '';
                var totalRow = '';

                var tableResult = '';
                for(var i = 0; i < rows.length; i++)
                {
                    coalData = rows[i].coal;
                    coalData = coalData.toString();
                    gasData = rows[i].natural_gas;
                    gasData = gasData.toString();
                    nuclearData = rows[i].nuclear;
                    nuclearData = nuclearData.toString();
                    petroleumData = rows[i].petroleum;
                    petroleumData = petroleumData.toString();
                    renewableData = rows[i].renewable;
                    renewableData = renewableData.toString();
                    var totalRowValue = Math.round(coalData + gasData + nuclearData + petroleumData + renewableData);
                    totalRow = totalRowValue.toString();

                    tableResult = tableResult + '<tr><td>' + rows[i].state_abbreviation + '</td>' + '\n' + '<td>' + coalData + '</td>' +
                                '\n' + '<td>' + gasData + '</td>' + '\n' + '<td>' + nuclearData + '</td>' + '\n' + '<td>' +
                                petroleumData + '</td>' + '\n' + '<td>' + renewableData + '\n' + '<td>' + totalRow +'</td>';
                }
                response = response.replace('<td>tableData</td>', tableResult);
                WriteHtml(res, response);
            });
        });

        // modify `response` here
        
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
        var total_coal = [];
        var total_natural_gas = [];
        var total_nuclear_count = [];
        var total_petroleum_count = [];
        var total_renewable_count = [];
        var state_Chosen = '';
        state_Chosen = req.params.selected_state;
        state_Chosen = state_Chosen.toString();
        console.log(state_Chosen);

        // populate header
        response = response.replace('<h2>Yearly Snapshot</h2>', '<h2>' + state_Chosen + ' Yearly Snapshot' + '</h2>');

        response = response.replace('var state', 'var state = ' +  "'" + state_Chosen + "'");
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);

