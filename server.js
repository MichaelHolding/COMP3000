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
getAuth();
populateTemplates()


//APP Functions
app.get('', function (req,res) {
    res.render('home');
})
app.get('/problem', function (req,res){
    res.render('problem')
})
app.get('/complete',function(req,res){
    res.render('complete')
})
app.get('/client',function (req,res){
    res.render('client',{post:template_array});
})
app.get('/loading',function (req,res){
    res.render('loading');
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

        res.render('adminpage', { active:active_vms,template:template_array});
    })

})
app.post('/template', function (req, res) {
    let tempName = req.body.Name;
    let lib = req.body.ID;
    addTemplate(tempName,lib);
    template_array = [];
    populateTemplates();
    res.redirect('/admin');
})
app.post('/deploy',async function (req,res){
    console.log(req.body)

    //creating variables
    let name = req.body.Name;
    let selectedItem = req.body.vmSelect;
    let edit = '';
    if(req.body.edit == 'on'){
        edit = 'true';
    }else{
        edit = 'false';
    }
    let editCPU = req.body.editCPU;
    let editRam = ramGBtoMB(req.body.editRAM);
    if(edit == true){
        options = {
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            json:true,
            headers:{
                'vmware-api-session-id': session_id
            },
            body:{
                "spec": {
                    "name": name + "_VirtualMachine",
                    "placement": {
                        "folder": "group-v3001",
                        "host": "host-1013"
                    },
                    "disk_storage": {
                        "datastore": "datastore-1014"
                    },
                    "hardware_customization":{
                        "cpu_update": {
                            "num_cpus": editCPU
                        },
                        "memory_update": {
                            "memory": editRam
                        },
                    },
                    "powered_on":true
                }
            }

        };
    }else{
        options = {
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            json:true,
            headers:{
                'vmware-api-session-id': session_id
            },
            body:{
                "spec": {
                    "name": name + "_VirtualMachine",
                    "placement": {
                        "folder": "group-v3001",
                        "host": "host-1013"
                    },
                    "disk_storage": {
                        "datastore": "datastore-1014"
                    },
                    "powered_on":true
                }
            }

        };
    }
    await request.post('https://192.168.0.224/rest/vcenter/vm-template/library-items/' + selectedItem + '?action=deploy', options,
        function (err, response, body) {
            if(err) throw err;
            console.log(response.statusCode)
            console.log(body.value)
            if (response.statusCode ==200){
                let vmID = body.value;
                res.render('complete',{deployed:vmID})
            }if (response.statusCode == 401){
                res.render('problem',{message: 'There has been a problem connecting to vSphere. Please try again' +
                        'if the issue persists please contact your administrator'})
            }else{
                res.render('problem',{message: 'There has been a critical problem connecting to vSphere.' +
                        ' Please contact your administrator'})
            }

        })
})
app.post('/getIP',function (req,res){
    let id = req.body.vmID;
    options = {
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        json: true,
        headers: {
            'vmware-api-session-id': session_id
        }
    }
    request.get('https://192.168.0.224/rest/vcenter/vm/'+id+'/guest/identity',options,function (err,response,body) {
        console.log(response.statusCode);
        if (response.statusCode ==200){
            let ip_address = body.ip_address;
            console.log(ip_address)
        }if (response.statusCode == 401){
            res.render('problem',{message: 'There has been a problem connecting to vSphere. Please try again' +
                    'if the issue persists please contact your administrator'})
        }else{
            res.render('problem',{message: 'There has been a critical problem connecting to vSphere.' +
                    ' Please contact your administrator'})
        }
    })
})
function getAuth(){

    request.post('https://192.168.0.224/rest/com/vmware/cis/session',my_http_options,function (err,res,body){
        if(err) throw err;
        let json = JSON.parse(body);
        console.log(json);
        session_id = json.value;
        return res.statusCode;
    })
}
function byteToGB(value){
    let it1 = value/1024;
    let it2 = it1/1024;
    let final = it2/1024;
    return final;
}
function GBtoByte(value) {
    let it1 = value * 1024;
    let it2 = it1 * 1024;
    let final = it2 * 1024;
    return final;
}
function ramGBtoMB(value){
    let final = value*1024
    return final
}
function RAMConversion(value){
    let gb = value/1000;
    let final = Math.round(gb);
    return final;
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
                    library_item: result[i].vm_item,
                    cpu:result[i].cpu,
                    storage:result[i].storage,
                    RAM:result[i].ram,
                    OS:result[i].os
                };
                template_array.push(data);
            }
            console.log(template_array);
        })
    }
    function addTemplate($name, $id, $cpu,$hdd,$ram,$os){
        let sql = "Call AddTemplate(?,?,?,?,?,?)";
        con.query(sql, [$name, $id,$cpu,$hdd,$ram,$os], function (err) {
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



