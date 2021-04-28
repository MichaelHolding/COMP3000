//modules required for the application to work
const http = require('http');
const express =require('express');
const https = require('https');
const bodyparser = require('body-parser');
const mysql = require('mysql');
const request = require('request');
const exphbs = require('express-handlebars');


//classes

const vmClasses = require('./classes/vm.js');

const VM =  vmClasses.vm_type;
//variables
var session_id = '';
let vm_array = [];
const app = express();
let my_sso_password = 'Admin^123';
let my_sso_username = 'administrator@vsphere.local';
//API ID req options
my_http_options = {
    rejectUnauthorized: false,
    requestCert: true,
    agent: false,
    auth: {
        username: my_sso_username,
        password: my_sso_password
    }
};


//sets app to listen on port 3000
app.listen(3000,() => console.log('Listening on port 3000'));

app.use(express.static('public'));
app.use(bodyparser.json());
app.use('/images',express.static('images'));
app.use(bodyparser.urlencoded({extended : true}));
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
}));
app.set('view engine','hbs');

request.post('https://192.168.0.224/rest/com/vmware/cis/session',my_http_options,function (err,res,body){
    if(err) throw err;
    let json = JSON.parse(body);
    console.log(json);
    session_id = json.value;
})
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

//POPULATE DATA
populateVMArray();

//APP Functions

app.get('', function (req,res) {


    console.log(vm_array);
    res.render('home');

})
app.get('/admin', function (req,res) {


    console.log('vminfo requested');
    //standard http options
    options = {
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'vmware-api-session-id': session_id
        }
    }
    var active_vms =[];
    request.get('https://192.168.0.224/rest/vcenter/vm',options,function (err, response, body){
        if (err) throw err;
        let data = JSON.parse(body);
        console.log('status: '+ response.statusCode);
        let json = data.value;
        console.log(json.length)
        for(i = 0;i< json.length; i++){
            let activeMachine = {
                memory: json[i].memory_size_MiB,
                id: json[i].vm,
                name: json[i].name,
                power: json[i].power_state,
                cpu: json[i].cpu_count
            };
            active_vms.push(activeMachine);
        }
        console.log(active_vms)
        res.render('adminpage', {dbStuff: vm_array, active:active_vms});
    })

})



app.post('/', function (req, res) {

})




//Database Functions
    function populateVMArray() {
        let sql = "SELECT * FROM vm_type";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log('vm list populated');
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


    function addVirtualMachine($name, $hdd, $cpu, $ram) {
        con.connect(function (err) {
            if (err) throw err;
            console.log('connected');
            let sql = "Call AddVirtualMachine(?,?,?,?)";
            con.query(sql, [$name, $hdd, $cpu, $ram], function (err) {
                if (err) throw err;
                console.log('VM Added');
            })
        })

    }

    function updateVirtualMachine($id, $name, $hdd, $cpu, $ram) {
        con.connect(function (err) {
            if (err) throw err;
            console.log('connected');
            let sql = "Call UpdateVirtualMachine (?,?,?,?,?)";
            con.query(sql, [$id, $name, $hdd, $cpu, $ram], function (err) {
                if (err) throw err;
                console.log('VM updated');
            })
        })

    }

    function removeVM($id) {
        con.connect(function (err) {
            if (err) throw err;
            console.log('connected');
            let sql = "CALL RemoveVM(?)";
            con.query(sql, [$id], function (err) {
                if (err) throw err;
                console.log('connected');
            })
        })
    }



