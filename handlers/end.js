////////////////////////////////////////////////////////
// End Response...
//
function end(req, res){
    var end = new Date();
    var diff = end.getTime() - req.date.getTime();
    
    var mem = process.memoryUsage()
    sys.print(req.date.log_format())
    sys.print('[' + process.pid)
    sys.print('/' + bit_to_mb(mem.rss) + 'MB]')
    sys.print('[' + req.method + ']')
    sys.print(' ' + (diff / 1000).toString())
    sys.puts(' - ' + req.url)
    
    var body = res._body.join('')
    var length = body.length

    res.header['Content-Length'] = length;
    res.writeHead(res.status_code, res.header);
    res.write(body)
    res.end()

}

function bit_to_mb(v){
    return Math.round(Math.round( (v) / 1048576*100000)/100000).toString()
}