/*
{
    active:true,
    name:'page_test',
    site:'domain.com',
    type:'p', // p (page), m (module), f (funnel)
    variants:'a,b', // csv variants
    distribution:'80,20', // csv variant percentages
    step:'page1,page2,page3' // csv of page keys
}

*/

exports.base = {
    active:true,
    name:'page_test',
    site:'domain.com',
    type:'p', // p (page), m (module), f (funnel)
    variants:'a,b', // csv variants
    distribution:'50,50' // csv variant percentages
}


exports.page_test = {
    active:true,
    key:'/s/domain.com/p/t/page_test',
    name:'page_test',
    site:'domain.com',
    type:'p',
    variants:'a,b',
    distribution:'80,20',
    dates:'',
    events:'',
    spread:'aaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaab'
}

exports.module_test = {
    active:true,
    key:'/s/domain.com/m/t/module_test',
    name:'module_test',
    site:'domain.com',
    type:'m',
    variants:'a,b',
    distribution:'50,50',
    dates:'',
    events:'',
    spread:'abababababababababababababababababababababababababababababababababababababababababababababababababab'
}

exports.funnel_test = {
    active:true,
    key:'/s/domain.com/f/t/funnel_test',
    name:'funnel_test',
    site:'domain.com',
    type:'f',
    variants:'a,b',
    distribution:'50,50',
    dates:'',
    events:'',
    steps:'page_1,page_2,page_3',
    spread:'abababababababababababababababababababababababababababababababababababababababababababababababababab'
}

exports.bucket_test = '/s/domain.com/b/day'

exports.site = {
    name:'domain.com',
    token:'',
    user_key:'/u/gmelton'
}