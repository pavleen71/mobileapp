// const sql = require("mssql");

// const config = {
//     user: 'Pavleen',
//     password: 'pavjas',
//     server: 'PAVLEEN\SQLEXPRESS',
//     database: 'ExpenseTrackerDB',
//     options: {
//         encrypt: true,
//         trustServerCertificate: true
//     }
// };

// sql.connect(config)
//     .then(() => console.log("Connected to SQL Server"))
//     .catch(err => console.log("DB Connection Failed", err));

// module.exports = sql;

const sql = require("mssql");

const config = {
    user: 'Pavleen',
    password: 'pavjas',
    server: 'localhost',          // or your machine name or IP address
    database: 'ExpenseTrackerDB',
    options: {
        encrypt: false,           // local connections usually don't need encryption
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS' // use this if you're using a named instance
    }
};

sql.connect(config)
    .then(() => console.log("Connected to SQL Server"))
    .catch(err => console.log("DB Connection Failed", err));

module.exports = sql;
