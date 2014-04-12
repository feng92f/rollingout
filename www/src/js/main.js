require(['domReady','App'],
    function (domReady,App) {
        // domReady is RequireJS plugin that triggers when DOM is ready

        if(console && console.log){
          // console.log = function(){}
        }
        console.log('load');

        domReady(function () {
          App.roll({env:'web'});
        });
    }
);
