////////////////////////////////////////////////////////
// End Response...
//
function end(req, res){
    var end = new Date();
    var diff = end.getTime() - req.date.getTime();
    
    var mem = process.memoryUsage()
    util.print(req.date.log_format())
    if (req.headers['x-real-ip'] != undefined){
        util.print('[' + req.headers['x-real-ip'] + ']')
    } else {
        util.print('[' + req.socket.remoteAddress + ']')
    }
    util.print('['+ req.socket.server.port.toString())
    util.print('/' + process.pid)
    util.print('/' + bit_to_mb(mem.rss) + 'MB]')
    util.print('[' + req.method + ']')
    util.print(' ' + (diff / 1000).toString())
    util.puts(' - ' + req.url)
    
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