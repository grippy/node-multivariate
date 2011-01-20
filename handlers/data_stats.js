function data_stats(req, res, params){
    inspect(params)
    var data_key = '/' + params.data_key
    var stats = {points:[], columns:[]}
    Step(
        function get_length(){
            puts(data_key)
            redis.llen(data_key, this)
        },
        function load(err, len){
            puts(len)
            redis.lrange(data_key, 0, len, this)
        },
        function render(err, results){
            for(var i=0, ii=results.length, p; i < ii;i++){
                try{
                    p=JSON.parse(results[i])
                    stats.points.push(p)
                } catch(e){}
            }
            var point = (stats.points[0] != undefined) ? stats.points[0] : {}
            for(var p in point){
                stats.columns.push(p)
            }
            res.body(JSON.stringify(stats))
            end(req, res)
        }
    )
}