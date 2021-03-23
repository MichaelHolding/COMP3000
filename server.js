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
let my_vcsa_host = '192.168.0.224';
let my_sso_password = 'FX8150^blk';
let my_sso_username = 'root';


let vm_array = [];





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
createSession();
populateVMArray();


app.get('/', function (req,res) {
        console.log(vm_array);
        res.render('home', {
            post: vm_array
        });

})

app.get('/GetVMinfo', function(req, res){
    console.log('vminfo reached');
    let data = getVMdata();
    console.log(data)
    res.render('admin',{vmdata: data});


})

app.post('/', function(req, res){

})


// Prepare the HTTP request.


//functions for the website to work
function getVMdata(){
    let json ='';
    my_http_options = {
        host: my_vcsa_host,
        port: httpPort,
        path: 'rest/vcenter/vm',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        auth: my_sso_username + ":" + my_sso_password
    };
    https.request(my_http_options,function(result,){
        json = JSON.parse(result)
        console.log(result);

    })
    return json;
}
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
function createSession(){
    my_http_options = {
        host: my_vcsa_host,
        port: httpPort,
        path: '/rest/com/vmware/cis/session',
        method: 'POST',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        auth: my_sso_username + ":" + my_sso_password
    };
    https.request(my_http_options, callback).end();
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




