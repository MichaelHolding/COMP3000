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
let httpMethod = 'POST'
let my_vcsa_host = '192.168.0.224';
let my_sso_password = 'Admin^123';
let my_sso_username = 'administrator@vsphere.local';
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

let vm_array = [];


//sets app to listen on port 3000
app.listen(3000,() => console.log('Listening on port 3000'));

app.use(express.static('public'));
app.use(bodyparser.json());
app.use('/images',express.static('images'));
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
//ISSUE COOKIE REQUEST
https.request(my_http_options, callback).end();
//POPULATE DATA FROM DB
populateVMArray();


app.get('', function (req,res) {
        console.log(vm_array);
        res.render('home', {
            post: vm_array
        });

})
app.get('/admin', function (req,res){
    console.log('vminfo requested');

    console.log(my_http_options);
    my_http_options.path = '/rest/vcenter/vm';
    my_http_options.method = 'GET';

    console.log('New Options');
    console.log(my_http_options);
    var data = {};
    https.request(my_http_options,callBack).end();
    console.log(data);


    res.render('adminpage',{dbStuff:vm_array});
})



app.post('/', function(req, res){

})





//functions for the website to work


function callBack(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(response);
    }
}
function callback(res) {
    console.log("STATUS: " + res.statusCode);
    res.on('error', function(err) { console.log("ERROR in SSO authentication: ", err) });
    res.on('data', function(chunk) {});
    res.on('end', function() {
        if (res.statusCode == 200) {
            // Save session ID authentication.
            var cookieValue = res.headers['set-cookie'];
            my_http_options.headers = {'Cookie': cookieValue};
            // Remove username-password authentication.
            my_http_options.auth = {};
        }
        console.log("Session ID:\n" + res.headers['set-cookie']);
    })
}
function populateVMArray(){
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
    })
}


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




