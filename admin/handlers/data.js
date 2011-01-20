function data(req, res, params){


    
    // remove the format from the 
    var format = 'html';
    var data_key = params.data_key
    puts(data_key)
    puts(data_key.indexOf('.json'))
    if (data_key.indexOf('.json') > -1){
        res.header['Content-Type'] = 'application/json'
        data_key = data_key.replace('.json', '')
        format = 'json';
    } else if (data_key.indexOf('.csv') > -1) {
        res.header['Content-Type'] = 'text/csv'
        data_key = data_key.replace('.csv', '')
        format = 'csv';
    }
    inspect(params)
    puts(format)
    var url = '/stats/data/' + data_key
    get(url, function(r){
        puts(r)
        var o = {'points':[]}
        if (format == 'html') {
            var env = {
                // stats:JSON.parse(results),
                // bucket_key:bucket_key,
                // buckets_key:buckets_key,
                // url:url
            }
            var body = views.data.parse(env)
            var page = views.layout.parse({body:body, 'title': 'data'})
                res.body(page)
        } else if(format=='csv'){
            var o = {}
            // try{
                o = JSON.parse(r)
                var cols = o.columns
                res.body('"' + cols.join('","') + '"\n')
                for (var i=0, ii=o.points.length, p, line; i<ii; i++){
                    p = o.points[i]
                    line = [], len = cols.length
                    for (var j=0, c; j<len; j++){
                        c = cols[j]
                        line.push((p[c]!=undefined) ? p[c] : '')
                    }
                    res.body('"' + line.join('","') + '"\n')                    
                }
            // } catch(e){}
        } else if(format=='json'){
            res.body(r)
        }
        end(req, res)
    })
}