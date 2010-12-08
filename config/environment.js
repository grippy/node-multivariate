exports.development = {
    redis_db:0,
    redis_host:'127.0.0.1',
    redis_port:6379,
    app_port:[8000,8001],
    admin_port:9000
}

exports.testing = {
    redis_db:15,
    redis_host:'127.0.0.1',
    redis_port:6379,
    app_port:[5000],
    admin_port:5001
}

exports.production = {
    redis_db:0,
    redis_host:'127.0.0.1',
    redis_port:6379,
    app_port:[8000],
    admin_port:9000
}