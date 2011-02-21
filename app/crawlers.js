var util = require('util');

/*
http://www.useragents.org/database-view.asp?cat=0&id=4
*/

var re = new RegExp(/(googlebot(?:-mobile)?)|facebookexternalhit|Yahoo! Slurp|msnbot|Baiduspider|bingbot|YandexBot|MLBot/i)

function crawler(user_agent){
    return re.test(user_agent)
}
exports.crawler = crawler

