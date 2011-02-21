var util = require('util');

/*
    Shallow class for mostly displaying bucket stats...
    All updates for bucket stats currently handled in the bucket controller/action.
*/

function Bucket(){return this}
Bucket.prototype = {
    init:function(){},
    format_epoch:function(e){
        var d = new Date(parseInt(e, 10));
        var month = ((d.getMonth() + 1) > 9) ? (d.getMonth() + 1).toString() : '0' + (d.getMonth() + 1).toString()
        var date = ((d.getDate() > 9) ? d.getDate().toString() : '0' + d.getDate().toString())        
        return d.getFullYear().toString() + '-' + month + '-' + date
    },
    get_stat_val:function(key){
        if (this.stats[key] != undefined){
            return this.stats[key]
        }
        return 0
    },
    stat_sum:function(){
        // aggregate all date stats for base key
    },
    end:function(){}
}
exports.Bucket = Bucket