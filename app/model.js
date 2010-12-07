var sys = require('sys'),
    buffer = require('buffer');

var Model = {
    _create:false,
    _dirty:false,
    
    /* load an object which is already saved */
    load:function(props){
        var val;
        for(p in props){
            val = props[p]
            if (val) {
                this[p] = props[p].toString('utf8')
                this['__' + p] = props[p].toString('utf8')
            } else {
                this[p] = props[p]
                this['__' + p] = props[p]
            }
        }
        return this;
    },
    
    /* mark this object as something which is new */
    create:function(props){
        this.load(props)
        this._create = true;
        this._dirty = true;
        return this;
    },
    // overridable function called directly after loading...
    init:function(){},
    dirty_props:function(){
        // create a dump string for redis...
        // HMSET 	 key field1 value1 ... fieldN valueN 	 Set the hash fields to their respective values.
        // for updates, only update the dirty values.
        var dirty = [this.key], props={}, name, update=false;
        for(p in this){
            if (p.indexOf('__') > -1){
                name = p.replace('__','')
                if (this._dirty || this[name] != this[p]) {
                    // dirty.push(name)
                    // dirty.push(this[name])
                    props[name] = this[name]
                    update = true;
                }
            }
        }
        if (update) {
            var time = new Date().getTime()
            if (this._create){
                // dirty.push('created_at')
                // dirty.push(time)
                props['created_at'] = time
            }
            // dirty.push('updated_at')
            // dirty.push(time)
            props['updated_at'] = time
            dirty.push(props)
            
            // sys.puts(sys.inspect(this))
            // sys.puts(sys.inspect(props))
            
            return dirty
        }
        return [null, null];
    },
    end:function(){}
}

exports.Model = Model

function Extend(from, to){
	var val;
	for(var prop in from) {
		val = from[prop];
		if (val){
			if (to.prototype[prop] === undefined) {
				to.prototype[prop] = val
			}
		} else {
			if (to[prop] === undefined) {
				to[prop] = val
			}
		}

	}
}

exports.Extend = Extend
