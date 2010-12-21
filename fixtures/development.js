exports.tests = {
    // module tests...
    module_test:{
        active:true,
        name:'module_test',
        site:'domain.com',
        type:'m',
        variants:'a,b',
        distribution:'50,50'
    },
    // page tests...
    page_test:{
        active:true,
        name:'page_test',
        site:'domain.com',
        type:'p',
        variants:'a,b',
        distribution:'80,20',
        spread:'aaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaab'
    },
    // funnel tests...
    funnel_test:{
        active:true,
        name:'funnel_test',
        site:'domain.com',
        type:'f',
        variants:'a,b',
        distribution:'80,20',
        steps:'page_1,page_2,page_3',
        spread:'aaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaab'

    }
}
