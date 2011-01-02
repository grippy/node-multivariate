exports.development = {
    redis_db:0,
    redis_host:'127.0.0.1',
    redis_port:6379,
    app_stats_offset:0,
    app_port:8000,
    admin_port:9000
}

exports.testing = {
    redis_db:15,
    redis_host:'127.0.0.1',
    redis_port:6379,
    app_stats_offset:0,
    app_port:5000,
    admin_port:5001
}

exports.production = {
    redis_db:0,
    redis_host:'127.0.0.1',
    redis_port:6379,
    app_port:8000,
    app_stats_offset:-8, // adjusts redis date keys to some other timezone. mainly useful to sync a multivar appserver with some other analytics reporting timezone. Leave 0 if you no adjustment required.
    app_slaves:1,     // only recognized when using node scripts/production.js
    admin_port:9000
}