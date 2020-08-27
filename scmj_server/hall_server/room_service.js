var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var app = express();

var hallIp = null;
var config = null;
var rooms = {};
var serverMap = {};
var roomIdOfUsers = {};

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/register_gs', function (req, res) {
    var ip = req.ip;
    var clientip = req.query.clientip;
    var clientport = req.query.clientport;
    var httpPort = req.query.httpPort;
    var load = req.query.load;
    var id = clientip + ":" + clientport;

    if(serverMap[id]){
        var info = serverMap[id];
        if(info.clientport != clientport
            || info.httpPort != httpPort
            || info.ip != ip
        ){
            console.log("duplicate gsid:" + id + ",addr:" + ip + "(" + httpPort + ")");
            http.send(res,1,"duplicate gsid:" + id);
            return;
        }
        info.load = load;
        http.send(res,0,"ok",{ip:ip});
        return;
    }
    serverMap[id] = {
        ip:ip,
        id:id,
        clientip:clientip,
        clientport:clientport,
        httpPort:httpPort,
        load:load
    };
    http.send(res,0,"ok",{ip:ip});
    console.log("game server registered.\n\tid:" + id + "\n\taddr:" + ip + "\n\thttp port:" + httpPort + "\n\tsocket clientport:" + clientport);

    var reqdata = {
        serverid:id,
        sign:crypto.md5(id+config.ROOM_PRI_KEY)
    };
    //获取服务器信息
    http.get(ip,httpPort,"/get_server_info",reqdata,function(ret,data){
        if(ret && data.errcode == 0){
            for(var i = 0; i < data.userroominfo.length; i += 2){
                var userId = data.userroominfo[i];
                var roomId = data.userroominfo[i+1];
            }
        }
        else{
            console.log(data.errmsg);
        }
    });
});