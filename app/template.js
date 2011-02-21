// A simple templating solution inspired by John Resig's microtemplates.
// John Resig - http://ejohn.org/ - MIT Licensed
// Modified for node.JS by Tim Caswell <tim@creationix.com>
// Rewritten by Andreas Kalsch to preserve newlines and accept single quotes
// Modified by grippy to include other juicey bits
var util = require('util'); 

function Template(name, format, str){
	this.init(name, format, str)
}

Template.prototype = {
	env:null,
	name:null,
	format:null,
	parts:[],
	partials:{},
	init:function(name, format, str){
		this.name = name;
		this.format = format;
		this.parts = str.split(/<%|%>/);
		this.generate();
	},
	inspect:function(o){
        var s = util.inspect(o, false, null)
        return s.replace(/\n/g,'<br />')
	},
	to_json:function(o){
        return JSON.stringify(o)
	},
	partial:function(name){
		if (name.indexOf('_') != 0){name = '_' + name;}
		var tmpl = this.partials[name]
		if (tmpl){
			var params = (arguments[1] != undefined) ? arguments[1] : {};
			return tmpl.parse(params)
		}
		return "Can't find partial: " + name
	},	
	
	generate:function(){
		var debug = '';
        // var type = (this.name.indexOf('_') > 0) ? 'template' : 'partial'; 
		if ((this.format == 'html' || this.format == 'xml') && this.name.indexOf('layout')==-1){
			debug += ' p.push("<!-- template: '+ this.name +' -->\\n\\\n");'
		}
		var func = ' var p=[],' +
			' print=function(){p.push.apply(p,arguments)};' +
			debug +
			' with(params){';
		for (var ii = this.parts.length, i = 0; i < ii; i++) {
		  func += i % 2
		    ? (
		      this.parts[i][0] == '='
		        ? "print("+this.parts[i].substr(1)+");"
		        : this.parts[i]
		    )
		    : "p.push('"+this.parts[i].replace(/\n/g, '\\n\\\n').replace(/'/g, "\\'")+"');";
		  func += "\n";
		}
		func += "	} return p.join('');"
		this.parse = new Function("params", func);	
	}
}
// Extend(ViewHelper, Template)
exports.Template = Template
