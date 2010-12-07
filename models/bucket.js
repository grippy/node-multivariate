var sys = require('sys')

/*
    Shallow class for mostly displaying bucket stats...
    All updates for bucket stats currently handled in the bucket controller/action.
*/

function Bucket(){return this}
Bucket.prototype = {
    init:function(){},
    format_epoch:function(e){
        var d = new Date(parseInt(e, 10));
        return d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getDate().toString()
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