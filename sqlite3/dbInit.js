/**
 * Created by skykingit on 2018/12/01.
 */


var sqlite3 = require('sqlite3').verbose();
var Setting = require("../lib/setting.js");
const DBPath = Setting.DBPath;

console.log(DBPath);

var db;
class DB{
	constructor(){
		db = new sqlite3.Database(DBPath,function(data){
		    // console.log(data);
		});
	}

	init(){
        return new Promise(function (resolve,reject) {
        db.serialize(function() {
        	let sql="CREATE TABLE IF NOT EXISTS tb_account(id integer PRIMARY KEY, privateKey text,address text,createTime text);CREATE TABLE IF NOT EXISTS tb_transaction(id integer PRIMARY KEY, blockNumber text,timeStamp text,hash text,nonce text,blockHash text,contractAddress text,fromaddress text,toaddress text,value real,gas text,gasPrice text,gasUsed text, createTime text，type integer,parentId integer,chainName text);"
                db.run(sql,function (err) {
                    if(!err){
                        resolve("ok");
                        console.log("init db complete");
                    }else{
                        reject(err);
                        console.log("init db error: "+err);
                    }
                });
            });
        });
	}

}

module.exports = new DB();