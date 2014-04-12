define(['fsm', 'moment', 'underscore', 'Backbone', 'Marionette', 'jquery', 'config','plugins'], function(fsm, moment, _, Backbone, Marionette, $, config){

   //Application level event aggregator
   //Application level laylout
   var App = window.App = new Marionette.Application();

   App.version = '0.2';

   var DivRegion = Backbone.Marionette.Region.extend({
      el: "#Div",
      initialize: function(options){
      }
   });

   App.addRegions({
      div      :  DivRegion
   });

   App.fsm = fsm.create({
     initial: 'stone',
     events: [{ name: 'start',  from: 'close',   to: 'open'    }]
   });

   App.configs = {};
   App.configs.start = new Date().getTime();


   App.init = function(info){

     App.start(App);

   }

   App.on("initialize:after", function(){
       Backbone.history.start();
   });

   App.addInitializer(function(args){
   });

   App.roll = function(options){

     this.env = window.env = options.env;

     App.init();

     //COR support
     $.ajaxSetup({
       global: false,
       xhrFields: {
         withCredentials: false
       }
     });

     return;

   };

   return App;


});
