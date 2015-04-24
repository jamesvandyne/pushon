$(document).ready(function() {
    window.push_register = function() {
        if ("WebSocket" in window) {
            var url = "ws://" + document.domain + ":5000/api/push_socket/"
            var ws = new WebSocket(url);
            $(window).on('beforeunload', function() {
                console.log("closing websocket");
                ws.close();
            });
            ws.onopen = function () {
                //setTimeout(alert('Websocket Handshake successfully established. Ready for data...'), 1000);
                $('#con_status').html("connected")
            };
            ws.onmessage = function (msg) {
                var jmsg = JSON.parse(msg.data);
                //alert("Got message" + msg.data);
                $('#message').append("<li><pre><code>" + msg.data + "</code></pre></li>");
            }
        } else {
            alert("WebSocket not supported");
        }
    }
});
