// Built-in Node.js modules
const fs = require('fs');
const path = require('path');

// NPM modules
const express = require('express');
const sqlite3 = require('sqlite3');

const public_dir = path.join(__dirname, 'public');
const template_dir = path.join(__dirname, 'templates');
const db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

const app = express();
const port = 8000;

// open usenergy.sqlite3 database
const db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, err => {
    if (err) {
        console.log('Error opening ' + db_filename);
    } else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));

app.get('/coal_count', (req, res) => {
    let total = 0;
    db.all('SELECT coal FROM Consumption WHERE year = ?', ['2017'], (err, rows) => {
        for (let i = 0; i < rows.length; i++) {
            total = total + rows[i].coal;
        }
        res.send(total.toString());
    });
});

// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html'))
        .then(template => {
            let response = template;
            // modify `response` here
            let total_coal = 0;
            let total_natural_gas = 0;
            let total_nuclear_count = 0;
            let total_petroleum_count = 0;
            let total_renewable_count = 0;

            db.all('SELECT * FROM Consumption WHERE year = ?', ['2017'], (err, rows) => {
                for (let i = 0; i < rows.length; i++) {
                    total_coal = total_coal + rows[i].coal;
                    total_natural_gas = total_natural_gas + rows[i].natural_gas;
                    total_nuclear_count = total_nuclear_count + rows[i].nuclear;
                    total_petroleum_count = total_petroleum_count + rows[i].petroleum;
                    total_renewable_count = total_renewable_count + rows[i].renewable;
                }

                response = response.replace('var coal_count', 'var coal_count = ' + total_coal);
                response = response.replace('var natural_gas_count', 'var natural_gas_count = ' + total_natural_gas);
                response = response.replace('var nuclear_count', 'var nuclear_count = ' + total_nuclear_count);
                response = response.replace('var petroleum_count', 'var petroleum_count = ' + total_petroleum_count);
                response = response.replace('var renewable_count', 'var renewable_count = ' + total_renewable_count);

                db.all('SELECT * FROM Consumption WHERE year = ?', ['2017'], (err, rows) => {
                    let tableResult = '';
                    for (let i = 0; i < rows.length; i++) {
                        tableResult =
                            tableResult +
                            '<tr><td>' +
                            rows[i].state_abbreviation +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].coal +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].natural_gas +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].nuclear +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].petroleum +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].renewable +
                            '</td></tr>';
                    }
                    response = response.replace('<td>tableData</td>', tableResult);
                    WriteHtml(res, response);
                });
            });
            // db.all for populating table
        })
        .catch(() => Write404Error(res));
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);

    ReadFile(path.join(template_dir, 'year.html'))
        .then(template => {
            let response = template;
            // modify response here

            let total_coal = 0;
            let total_natural_gas = 0;
            let total_nuclear_count = 0;
            let total_petroleum_count = 0;
            let total_renewable_count = 0;
            let yearSelected = '';
            yearSelected = req.params.selected_year;

            if (yearSelected > 2017 || yearSelected < 1960) {
                res.status(404).send('Error: no data for ' + yearSelected);
            }

            // populate year header
            response = response.replace('National Snapshot', yearSelected + ' National Snapshot');
            response = response.replace('var year', 'var year = ' + req.params.selected_year);

            db.all('SELECT * FROM Consumption WHERE year = ?', [yearSelected], (err, rows) => {
                for (let i = 0; i < rows.length; i++) {
                    total_coal = total_coal + rows[i].coal;
                    total_natural_gas = total_natural_gas + rows[i].natural_gas;
                    total_nuclear_count = total_nuclear_count + rows[i].nuclear;
                    total_petroleum_count = total_petroleum_count + rows[i].petroleum;
                    total_renewable_count = total_renewable_count + rows[i].renewable;
                }
                response = response.replace('var coal_count', 'var coal_count = ' + total_coal);
                response = response.replace('var natural_gas_count', 'var natural_gas_count = ' + total_natural_gas);
                response = response.replace('var nuclear_count', 'var nuclear_count = ' + total_nuclear_count);
                response = response.replace('var petroleum_count', 'var petroleum_count = ' + total_petroleum_count);
                response = response.replace('var renewable_count', 'var renewable_count = ' + total_renewable_count);
                db.all('SELECT * FROM Consumption WHERE year = ?', [yearSelected], (err, rows) => {
                    let totalRow = '';

                    let tableResult = '';
                    for (let i = 0; i < rows.length; i++) {
                        const totalRowValue = rows[i].coal + rows[i].natural_gas + rows[i].nuclear + rows[i].petroleum + rows[i].renewable;
                        totalRow = totalRowValue.toString();

                        tableResult =
                            tableResult +
                            '<tr><td>' +
                            rows[i].state_abbreviation +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].coal +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].natural_gas +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].nuclear +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].petroleum +
                            '</td>' +
                            '\n' +
                            '<td>' +
                            rows[i].renewable +
                            '\n' +
                            '<td>' +
                            totalRow +
                            '</td>';
                    }

                    response = response.replace('<td>tableData</td>', tableResult);

                    if (yearSelected == 1960) {
                        response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/year/1961\x22>Next</a>');
                        response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/year/1960\x22>Prev</a>');
                    } else if (yearSelected == 2017) {
                        response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/year/2016\x22>Prev</a>');
                        response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/year/2017\x22>Next</a>');
                    } else {
                        response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/year/' + (parseInt(yearSelected) - 1) + '\x22>Prev</a>');
                        response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/year/' + (parseInt(yearSelected) + 1) + '\x22>Next</a>');
                    }
                    WriteHtml(res, response);
                });
            });

            // modify `response` here
        })
        .catch(() => Write404Error(res));
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', async (req, res) => {
    try {
        const template = await ReadFile(path.join(template_dir, 'state.html'));

        let response = template;
        // modify `response` here

        let state_Chosen = '';
        state_Chosen = req.params.selected_state;
        state_Chosen = state_Chosen.toString();
        console.log(state_Chosen);

        // populate header
        let fullStateName = '';

        const [states, consumption] = await Promise.all([fetchDb('SELECT * FROM States', []), fetchDb('SELECT * FROM Consumption ORDER BY year', [])]);

        for (let i = 0; i < states.length; i++) {
            if (state_Chosen === states[i].state_abbreviation) {
                fullStateName = states[i].state_name;
            }
        }

        response = response.replace('<h2>Yearly Snapshot</h2>', '<h2>' + fullStateName + ' Yearly Snapshot' + '</h2>');
        response = response.replace('var state', 'var state = ' + "'" + state_Chosen + "'");

        const total_coal = [];
        const total_natural_gas = [];
        const total_nuclear_count = [];
        const total_petroleum_count = [];
        const total_renewable_count = [];
        let tableResult = '';
        let totalRow = 0;

        // get the state
        let stateIteration = consumption[0].state_abbreviation;
        let j = 0;

        while (state_Chosen != stateIteration) {
            if (j > 50) res.status(404).send('Error: no data for state ' + state_Chosen);

            j++;
            stateIteration = consumption[j].state_abbreviation;
        }

        let i = j;
        while (i < consumption.length) {
            totalRow = Math.round(
                consumption[i].coal + consumption[i].natural_gas + consumption[i].nuclear + consumption[i].petroleum + consumption[i].renewable,
            );

            tableResult =
                tableResult +
                '<tr><td>' +
                consumption[i].year +
                '</td>' +
                '\n' +
                '<td>' +
                consumption[i].coal +
                '</td>' +
                '\n' +
                '<td>' +
                consumption[i].natural_gas +
                '</td>' +
                '\n' +
                '<td>' +
                consumption[i].nuclear +
                '</td>' +
                '\n' +
                '<td>' +
                consumption[i].petroleum +
                '</td>' +
                '\n' +
                '<td>' +
                consumption[i].renewable +
                '\n' +
                '<td>' +
                totalRow +
                '</td>';
            total_coal.push(consumption[i].coal);
            total_natural_gas.push(consumption[i].natural_gas);
            total_nuclear_count.push(consumption[i].nuclear);
            total_petroleum_count.push(consumption[i].petroleum);
            total_renewable_count.push(consumption[i].renewable);
            i = i + 51;
        }

        response = response.replace('var coal_counts', 'var coal_counts = ' + '[' + total_coal + ']');
        response = response.replace('var natural_gas_counts', 'var natural_gas_counts = ' + '[' + total_natural_gas.toString() + ']');
        response = response.replace('var nuclear_counts', 'var nuclear_counts = ' + '[' + total_nuclear_count.toString() + ']');
        response = response.replace('var petroleum_counts', 'var petroleum_counts = ' + '[' + total_petroleum_count.toString() + ']');
        response = response.replace('var renewable_counts', 'var renewable_counts = ' + '[' + total_renewable_count.toString() + ']');
        response = response.replace('<td>tableData</td>', tableResult);

        if (state_Chosen == 'AK') {
            response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/state/AL\x22>Next</a>');
            response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/state/WY\x22>Prev</a>');
        } else if (state_Chosen == 'WY') {
            response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/state/WV\x22>Prev</a>');
            response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/state/AK\x22>Next</a>');
        } else {
            response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/state/' + consumption[j - 1].state_abbreviation + '\x22>Prev</a>');
            response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/state/' + consumption[j + 1].state_abbreviation + '\x22>Next</a>');
        }
        //images
        response = response.replace('<img src="/images/noimage.jpg" alt="No Image" width="250" height="auto" />',
                                    '<img src="/images/' +fullStateName+ '.jpg" alt="'+fullStateName+'" width="250" height="300" />');

        WriteHtml(res, response);
    } catch {
        Write404Error(res);
    }
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html'))
        .then(template => {

            let response = template;

            let energyTypeSelected = '';
            energyTypeSelected = req.params.selected_energy_type;
            energyTypeSelected = energyTypeSelected.toString();
            // modify `response` here

            //const [states] = await Promise.all([fetchDb('SELECT * FROM Consumption ORDER BY state_abbreviation,year', [])]);

            response = response.replace('var energy_type', 'var energy_type = ' + "'" + energyTypeSelected + "'");

            //populate header
            response = response.replace('<h2>Consumption Snapshot</h2>', '<h2>' + energyTypeSelected + ' Consumption Snapshot</h2>');

            // for each state, loop thru all years and get selected coal type
            //object will have name:value PerformanceObserverEntryList, name is state_abbreviation value is array of energytype

            db.all('SELECT * FROM Consumption ORDER BY state_abbreviation,year', (err, rows) => {
                let stateKey = '';
                let energyObj = {};

                // loop through each state
                let i = 0;
                while (i < rows.length) {
                    stateKey = rows[i].state_abbreviation;
                    const energyValue = [];
                    // loop through energy source from 1960 - 2017
                    let currentState = stateKey;
                    while (currentState === stateKey) {
                        energyValue.push(rows[i][energyTypeSelected]);
                        i++;
                        if (i < rows.length) {
                            currentState = rows[i].state_abbreviation;
                        } else {
                            currentState = '';
                        }
                    }
                    // here is where we push our array of energy to the value (key-value)
                    energyObj[stateKey] = energyValue;
                }
                energyObj = JSON.stringify(energyObj);
                //console.log(energyObj);
                response = response.replace('var energy_counts', 'var energy_counts = ' + energyObj);

                //db.all('SELECT * FROM Consumption ORDER by state_abbreviation, year', (err, rows) => {
                    let dataResult = '';
                    let data = 0;
                    let totalRow = 0;
                    i = 0;
                    let j = 0;
                    while (i < rows.length - 2900) {
                        //console.log(rows[i].year);
                        dataResult += '<tr><td>' + rows[i].year + '</td>';
                        j = i;
                        let counter = 0;
                        while (counter < 51) {
                            data = rows[j][energyTypeSelected];
                            dataResult += '<td>' + data + '</td>';
                            totalRow += data;
                            j += 58;
                            counter++;
                        }
                        i++;
                        dataResult += '<td>' + totalRow + '</td></tr>' + '\n';
                        totalRow = 0;
                    }
                    response = response.replace('<td>dataTable</td>', dataResult);

                        if (energyTypeSelected == 'coal') {
                            response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/energy-type/natural_gas\x22>Next</a>');
                            response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/energy-type/renewable\x22>Prev</a>');
                        } else if (energyTypeSelected == 'renewable') {
                            response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/energy-type/petroleum\x22>Prev</a>');
                            response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/energy-type/coal\x22>Next</a>');
                        } else {
                            const keysArr = ['coal', 'natural_gas', 'nuclear', 'petroleum', 'renewable'];
                            let k = 0;

                            while (energyTypeSelected != keysArr[k]) {
                                k++;
                            }
                            //console.log(keysArr[k + 1]);
                            response = response.replace('href=\x22\x22>Prev</a>', 'href=\x22/energy-type/' + keysArr[k - 1] + '\x22>Prev</a>');
                            response = response.replace('href=\x22\x22>Next</a>', 'href=\x22/energy-type/' + keysArr[k + 1] + '\x22>Next</a>');
                        }

                        //images
                        response = response.replace('<img src="/images/noimage.jpg" alt="No Image" width="250" height="auto" />',
                                                    '<img src="/images/' +energyTypeSelected+ '.jpg" alt="'+energyTypeSelected+'" width="250" height="300" />')

                        WriteHtml(res, response);
                });
            })
                // db.all for populating table
            .catch(() => Write404Error(res));
        });

function fetchDb(query, values) {
    return new Promise((resolve, reject) => {
        db.all(query, values, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

app.listen(port);
