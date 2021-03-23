//modules required for the application to work
const http = require('http');
const express =require('express');
const https = require('https');
const bodyparser = require('body-parser');
const mysql = require('mysql');
const exphbs = require('express-handlebars');

//classes

const vmClasses = require('./classes/vm.js');

const VM =  vmClasses.vm_type;
//variables
const app = express();

let httpPort = 443;
let httpPath = '/rest/com/vmware/cis/session';
let httpMethod = 'POST';
let my_vcsa_host = '192.168.0.224';
let my_sso_password = 'FX8150^blk';
let my_sso_username = 'root';

let vm_array = [];


// Prepare the HTTP request.
my_http_options = {
    host: my_vcsa_host,
    port: httpPort,
    path: httpPath,
    method: httpMethod,
    rejectUnauthorized: false,
    requestCert: true,
    agent: false,
    auth: my_sso_username + ":" + my_sso_password
};


//sets app to listen on port 3000
app.listen(3000,() => console.log('Listening on port 3000'));

app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended : true}));
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}));
app.set('view engine','hbs');

//setting up connection to database
const con = mysql.createConnection({
    host: "Proj-mysql.uopnet.plymouth.ac.uk",
    user: "COMP3000_MHolding",
    password: "UupB551+",
    database: "COMP3000_MHolding"
});
con.connect(function(err){
    if(err) throw err;
    console.log('connected');
})

app.get('/', function (req,res) {
    let sql = "SELECT * FROM vm_type";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log('vm list populated');
        console.log(result.length);
        for (i = 0; i < result.length; i++) {
            let vmType = {
                id: result[i].vm_type_id,
                name: result[i].vm_name,
                hdd: result[i].vm_hdd,
                cpus: result[i].vm_cpus,
                ram: result[i].vm_ram
            };
            console.log(vmType);
            vm_array.push(vmType)

        }
        res.render('home', {
            post: vm_array
        });
    });
})

app.get('/GetVMinfo', function(req, res){

})

app.post('/', function(req, res){

})



//functions for the website to work
// Define the callbacks.
function callback(res) {
    console.log("STATUS: " + res.statusCode);
    res.on('error', function (err) {
        console.log("ERROR in SSO authentication: ", err)
    });
    res.on('data', function (chunk) {
    });
    res.on('end', function () {
        if (res.statusCode == 200) {
            // Save session ID authentication.
            let cookieValue = res.headers['set-cookie'];
            my_http_options.headers = {'Cookie': cookieValue};
            // Remove username-password authentication.
            my_http_options.auth = {};
        }
        console.log("Session ID:\n" + res.headers['set-cookie']);
    })
}

// Issue the session creation request.
    https.request(my_http_options, callback).end();



//VM Functions
function populateVMs(){

    let sql = "SELECT * FROM vm_type";
    con.query(sql, function(err,result) {
        if (err) throw err;
        console.log('vm list populated');
        console.log(result.length);
        for (i = 0; i < result.length; i++) {
            let vmType = {
                id: result[i].vm_type_id,
                name: result[i].vm_name,
                hdd: result[i].vm_hdd,
                cpus: result[i].vm_cpus,
                ram: result[i].vm_ram
            };
            console.log(vmType);
            vm_array.push(vmType)

        }
        console.log(vm_array)
        return vm_array
    })

}

//queryResponce.forEach(function (i) {
   // let vmType = new VM(i.vm_type_id, i.vm_name, i.vm_hdd, i.vm_cpus, i.vm_ram)
 //   vm_array.push(vmType)
//})
//console.log('vm_array');
//console.log(vm_array);




































function addVirtualMachine($name, $hdd, $cpu,$ram){
    con.connect(function (err){
        if(err) throw err;
        console.log('connected');
        let sql = "Call AddVirtualMachine(?,?,?,?)";
        con.query(sql,[$name, $hdd, $cpu, $ram], function(err){
            if(err) throw err;
            console.log('VM Added');
        })
    })

}
function updateVirtualMachine($id, $name, $hdd, $cpu, $ram){
    con.connect(function(err){
        if(err) throw err;
        console.log('connected');
        let sql = "Call UpdateVirtualMachine (?,?,?,?,?)";
        con.query(sql,[$id, $name, $hdd, $cpu, $ram], function(err){
            if(err) throw err;
            console.log('VM updated');
        })
    })

}
function removeVM($id){
    con.connect(function(err) {
        if (err) throw err;
        console.log('connected');
        let sql = "CALL RemoveVM(?)";
        con.query(sql, [$id], function (err){
            if(err) throw err;
            console.log('connected');
        })
    })
}




