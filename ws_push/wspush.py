import traceback
import json
from uuid import uuid1
from geventwebsocket.handler import WebSocketHandler
from flask import Flask, request, render_template
import gevent
from gevent.queue import Queue
from gevent.pywsgi import WSGIServer

push_queue = Queue()

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    context = dict(errors=None, sent=None)
    try:
        if request.method == 'POST':
            data = request.form['data'].strip()
            try:
                x = json.loads(data)
                for key in x.keys():
                    if not key in ("message", "extras"):
                        raise Exception("invalid name in json dict, only message and extras are supported, not {0}".format(key))
                if not x.has_key('message'):
                    raise Exception("json dict must include a message key value pair")
                extras = x.get('extras', dict())
                extras['com.urbanairship.push.push_id'] = str(uuid1())
                x['extras'] = extras
                data = json.dumps(x, indent=4)
                push_queue.put(data)
                context["sent"] = data
            except:
                context["errors"]=traceback.format_exc()
            x = render_template('index.html', **context)
        else:
            x = render_template('index.html', **context)
    except:
        traceback.print_exc()
        raise
    return x

@app.route('/subscribe')
def subscribe():
    try:
        x = render_template('subscribe.html')
    except:
        traceback.print_exc()
        raise
    return x

@app.route('/api/push_socket/')
def push_socket():
    if request.environ.get('wsgi.websocket'):
        try:
            ws = request.environ['wsgi.websocket']
            print "set up live websocket for push emulation on socket {0}".format(ws)
        except:
            traceback.print_exc()
        while True:
            message = push_queue.get()
            print "sending", message, "on {0}".format(ws)
            ws.send(message)
    return


if __name__ == '__main__':
    http_server = WSGIServer(('0.0.0.0',5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
