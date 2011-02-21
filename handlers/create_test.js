////////////////////////////////////////////////////////
// Create a Test...
//
function create_test(req, res){
    
    var props = {
        active:false,
        key:'/s/grippy/p/t/page_test',
        name:'page_test',
        site:'grippy',
        type:'p',
        variants:'a,b',
        distribution:'80,20',
        dates:'',
        events:'',
        spread:'aaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaab'
    }
    
    Step(
        
        function clear(){
            redis.del(prop.key, this)
        },
        
        function create(err, reply){
            
            var test = new model.Test().create(props);
            var dirty = test.dirty_props();
            // util.puts(util.inspect(dirty))
            redis.hmset(dirty[0], dirty[1], this)
        },
        function load(err, reply){
            redis.hgetall(props.key, this)
        },
        function render(err, reply){
            var test = new Test().load(reply)
            res.body('/*\n')
            res.body('test:\n')
            res.body(util.inspect(test))
            res.body('*/\n')
            end(req, res)
        }
    )
    
}
