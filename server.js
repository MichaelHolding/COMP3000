//modules required for the application to work

const express =require('express');
const bodyparser = require('body-parser');
const mysql = require('mysql');
const request = require('request');
const exphbs = require('express-handlebars');

//////////////////////////////////////////////////////////////////////
////////////Variables to Configure////////////////////////////////////
//ESXi
let vSphere_host = '192.168.0.224';
let my_sso_password = 'Admin^123';
let my_sso_username = 'administrator@vsphere.local';

//database
let dbHost = "Proj-mysql.uopnet.plymouth.ac.uk";
let dbUser = "COMP3000_MHolding";
let dbPass = "UupB551+";
let db = "COMP3000_MHolding";

//Host machine customisation options
let cpuOptions = [2,4,8];
let ramOptions = [4,8,16];
//////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

//variables
var active_vms =[];
var template_array = [];
var session_id = '';
const app = express();

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
    host:dbHost ,
    user: dbUser,
    password: dbPass,
    database: db
});
con.connect(function(err){
    if(err) throw err;
    console.log('connected');
})

//POPULATE DATA
getAuth();
populateTemplates()


////////////////APP Functions///////////////////

///////////////GET Functions////////////////////
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
    res.render('client',{post:template_array, cpu:cpuOptions, ram:ramOptions});
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
    request.get('https://'+vSphere_host+'/rest/vcenter/vm',options,function (err, response, body){
        if (err) throw err;
        let data = JSON.parse(body);
        console.log('status: '+ response.statusCode);
        let json = data.value;
        console.log(json.length)
        for(i = 0;i< json.length; i++){
            let activeMachine = {
                memory: RAMConversion(json[i].memory_size_MiB),
                id: json[i].vm,
                name: json[i].name,
                power: powerFormating(json[i].power_state) ,
                cpu: json[i].cpu_count
            };
            active_vms.push(activeMachine);
        }
        console.log(active_vms);

        res.render('adminpage', { active:active_vms,template:template_array});
    })

})

///////////////POST Functions////////////////////

app.post('/template', function (req, res) {
    let tempName = req.body.Name;
    let lib = req.body.ID;
    let cpu = req.body.CPU;
    let ram = req.body.RAM;
    let hdd = req.body.HDD;
    let os = req.body.OS;
    addTemplate(tempName,lib,cpu,hdd,ram,os);
    template_array = [];
    populateTemplates();
    res.redirect('back')

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
    await request.post('https://'+vSphere_host+'/rest/vcenter/vm-template/library-items/' + selectedItem + '?action=deploy', options,
        function (err, response, body) {
            if(err) throw err;
            console.log(response.statusCode)
            console.log(body.value)
            if (response.statusCode ==200){
                let vmID = body.value;
                setTimeout(function (){
                    res.render('complete',{deployed:vmID})
                },75000);

            }else if (response.statusCode == 401){
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
    request.get('https://'+vSphere_host+'/rest/vcenter/vm/'+id+'/guest/identity',options,function (err,response,body) {
        console.log(response.statusCode);
        if (response.statusCode ==200){
            let ip_address = body.value.ip_address;
            res.render('details', {ip:ip_address})
            console.log(ip_address)
        }else if (response.statusCode == 401){
            res.render('problem',{message: 'There has been a problem connecting to vSphere. Please try again' +
                    'if the issue persists please contact your administrator'})
        }else{
            res.render('problem',{message: 'There has been a critical problem connecting to vSphere.' +
                    ' Please contact your administrator'})
        }
    })
})
app.post('/modifyVM', function (req,res){
    console.log(req.body);
    let id = req.body.id;
    if(req.body.powerOff === 'true'){
        powerOffVM(id);
        res.redirect('back');
    }else if(req.body.deleteVM === 'true'){
        deleteVirtualMachine(req.body.id);
        res.redirect('back');
    }


})
app.post('/modifyTemplate',function(req,res){
    console.log(req.body)
    if(req.body.btnUpdate === 'true'){
        updateTemplate(req.body.id,req.body.templateName,req.body.lib, req.body.cpu, req.body.storage, req.body.ram
            ,req.body.os);


    }else if (req.body.btnDelete === 'true'){
        removeTemplate(req.body.id)
        res.render('back')
    }
})


//functions
function getAuth(){

    request.post('https://'+vSphere_host+'/rest/com/vmware/cis/session',my_http_options,function (err,res,body){
        if(err) throw err;
        let json = JSON.parse(body);
        console.log(json);
        session_id = json.value;
        return res.statusCode;
    })
}
function powerOffVM(id){
    options = {
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'vmware-api-session-id': session_id
        }
    }
    request.post('https://'+vSphere_host+'/rest/vcenter/vm/'+id+'/power/stop',options,
        function (err,response,body){
            if(err) throw err;
            console.log(response.statusCode)

        })
}
function deleteVirtualMachine(id){
    options = {
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'vmware-api-session-id': session_id
        }
    }
    request.delete('https://'+vSphere_host+'/rest/vcenter/vm/'+id, options, function (err,response,body){
        console.log(response.statusCode)
        console.log('vm deleted');
    })
}
//math releated functions
function ramGBtoMB(value){
    let final = value*1024
    return final
}
function RAMConversion(value){
    let gb = value/1000;
    let final = Math.round(gb);
    return final;
}
//formatting functions
function powerFormating(state){
    let result = '';
    if(state =="POWERED_ON"){
        result = 'Powered ON'
        return result;
    }else{
        result = 'Powered OFF';
        return result;
    }
}



//Database Functions

    function populateTemplates(){
        let sql = "SELECT * FROM vm_template"
        con.query(sql, function (err, result){
            if(err) throw err;
            console.log('templates recived')
            for(i=0; i <result.length; i++){
                let data = {
                    id: result[i].template_id,
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
    function addTemplate($name, $libItem, $cpu,$hdd,$ram,$os){
        let sql = "Call AddTemplate(?,?,?,?,?,?)";
        con.query(sql, [$name, $libItem,$cpu,$hdd,$ram,$os], function (err) {
            if (err) throw err;
            console.log('Template Added');
        })
    }
    function updateTemplate($id,$name, $libItem, $cpu,$hdd,$ram,$os) {

        let sql = "Call UpdateTemplate (?,?,?,?,?,?,?)";
        con.query(sql, [$id, $name,$cpu,$hdd,$ram,$libItem,$os], function (err) {
            if (err) throw err;
            console.log('Template updated');
            template_array = [];
            populateTemplates();
            })
    }
    function removeTemplate($id) {
            let sql = "CALL RemoveTemplate(?)";
            con.query(sql, [$id], function (err) {
                if (err) throw err;
                console.log('Template Removed');
                template_array = [];
                populateTemplates();
            })
    }



