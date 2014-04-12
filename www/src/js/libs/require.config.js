require.config({
    //js
    baseUrl: './js',
    paths:{
        App:'modules/App',
        config:'modules/config',

        domReady:'libs/domReady',
        moment:'libs/moment',
        store:'libs/store',
        Backbone:'vendors/backbone/backbone',
        Subset:'vendors/backbone/backbone.virtual-collection',
        Syphon:'vendors/backbone/backbone.syphon',
        Transitionize:'libs/transitionize',
        Switchery:'libs/switchery',
        d3:'libs/d3',
        fsm:'libs/state-machine',

        Marionette:'vendors/backbone/backbone.marionette',
        jquery:'vendors/jquery/jquery-1.7.2',
        cookie:'libs/cookie',
        uuid:'libs/uuid',
        plugins:'libs/plugins',
        underscore:'vendors/underscore/underscore',
        tpl:'libs/tpl',

    }
});
