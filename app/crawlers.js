var sys = require('sys')

var re = new RegExp(/(googlebot(?:-mobile)?)|facebookexternalhit|Yahoo! Slurp|msnbot|Baiduspider|bingbot|YandexBot/i)

function crawler(user_agent){
    return re.test(user_agent)
}
exports.crawler = crawler

/*
http://www.useragents.org/database-view.asp?cat=0&id=4


66.220.149.247 - - [20/Nov/2010:23:37:23 +0000] "GET / HTTP/1.1" 499 0 "-" "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
67.195.111.241 - - [20/Nov/2010:23:37:23 +0000] "GET /music/artist/38653/Ruff-Ryders HTTP/1.0" 499 0 "-" "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)"
157.55.116.19 - - [20/Nov/2010:23:37:27 +0000] "GET /song/5217/Arbouretum-Ghosts-Of-Here-And-There HTTP/1.0" 499 0 "-" "msnbot/2.0b (+http://search.msn.com/msnbot.htm)._"
67.195.111.241 - - [20/Nov/2010:23:37:29 +0000] "GET /music/artist/843817/2-Dirty-ft-Vika-Kova HTTP/1.0" 499 0 "-" "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)"
119.63.198.83 - - [20/Nov/2010:23:37:32 +0000] "GET /song/884173/YMCK-04-Darling?page=4 HTTP/1.1" 499 0 "-" "Baiduspider+(+http://www.baidu.jp/spider/)"
207.46.204.229 - - [20/Nov/2010:23:37:33 +0000] "GET /music/artist/7883/Next HTTP/1.0" 499 0 "-" "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"
95.108.216.251 - - [20/Nov/2010:23:37:40 +0000] "GET /?page=134 HTTP/1.1" 502 173 "-" "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)"
95.
*/