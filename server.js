//modules required for the application to work
const http = require('http');
const express =require('express');
const https = require('https');
const bodyparser = require('body-parser');
const mysql = require('mysql');
const request = require('request');
const exphbs = require('express-handlebars');

//variables
var active_vms =[];
var template_array = [];
var templateDetails = [];
var session_id = '';
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

populateTemplates();
getAuth();
getTemplateInfo();

//APP Functions

app.get('', function (req,res) {
    res.render('home');
})
app.get('/client',function (req,res){
    res.render('client',{post:template_array});
})
app.get('/admin', function (req,res) {
    active_vms = [];

    options = {
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'vmware-api-session-id': session_id
        }
    }

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
        console.log(active_vms);
        console.log(templateDetails);
        res.render('adminpage', { active:active_vms,template:template_array});
    })

})
app.post('/template', function (req, res) {
    let tempName = req.body.Name;
    let lib = req.body.ID;
    addTemplate(tempName,lib);
    template_array = [];
    populateTemplates();


})
//functions
function getAuth(){
    request.post('https://192.168.0.224/rest/com/vmware/cis/session',my_http_options,function (err,res,body){
        if(err) throw err;
        let json = JSON.parse(body);
        console.log(json);
        session_id = json.value;
    })
}
function getTemplateInfo(){
    options = {
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'vmware-api-session-id': session_id
        }
    }
    for(i=0;i<template_array.length;i++){
        let vmID = template_array[i].library_item;
        let vmName = template_array[i].name;
        request.get('https://192.168.0.224/rest/vcenter/vm-template/library-items/'+vmID,options,function (err,response,body){
            if(err) throw err;
            let result = JSON.parse(body);
            let diskCapacity = result.value.disks[0].value.capacity;
            let ram = RAMConversion(result.value.memory.size_MiB);
            let data = {
                name: vmName,
                memory: ram,
                cpu: result.value.cpu.count,
                OS: result.value.guest_OS,
                disk:byteToGB(diskCapacity)
            }
            console.log(data)
            templateDetails.push(data);
        })

    }
}
function byteToGB(value){
    let it1 = value/1024;
    let it2 = it1/1024;
    let final = it2/1024;
    return final;
}
function RAMConversion(value){
    let gb = value/1000;
    let final = Math.round(gb);
    return final;
}
function deployFromTemplate(){

}
//Database Functions

    function populateTemplates(){
    let sql = "SELECT * FROM vm_template"
        con.query(sql, function (err, result){
            if(err) throw err;
            console.log('templates recived')
            for(i=0; i <result.length; i++){
                let data = {
                    name: result[i].template_name,
                    library_item: result[i].vm_item
                };
                console.log(data);
                template_array.push(data)
            }
        })
    }
    function addTemplate($name, $id){
        let sql = "Call AddTemplate(?,?)";
        con.query(sql, [$name, $id], function (err) {
            if (err) throw err;
            console.log('Template Added');
        })
    }
    function updateTemplate($name, $id) {
        con.connect(function (err) {
            if (err) throw err;
            console.log('connected');
            let sql = "Call UpdateTemplate (?,?)";
            con.query(sql, [$name, $id], function (err) {
                if (err) throw err;
                console.log('Template updated');
            })
        })

    }
    function removeTemplate($name) {
        con.connect(function (err) {
            if (err) throw err;
            console.log('connected');
            let sql = "CALL RemoveTemplate(?)";
            con.query(sql, [$id], function (err) {
                if (err) throw err;
                console.log('Template Removed');
            })
        })
    }



