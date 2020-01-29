import sys
import eventlet
import socketio
sys.path.append('/')
import jsonParser

sio = socketio.Server(cors_allowed_origins='*')

app = socketio.WSGIApp(sio, static_files={
    '/': {'content_type': 'text/html', 'filename': 'index.html'}
})

def switcher(i):
    switcher = {
        # 4 types that are usable
        'Drumming Fingers': 'TableScan',
        'Zooming In With Two Fingers': 'Join',
        'Zooming Out With Two Fingers': 'Join',
        'Pushing Hand Away': 'Project',
        'Pushing Hand In': 'Project',
        'Shaking Hand': 'Sort',
        'Stop Sign': 'Filter',
        # orientation gestures
        'Swiping Left': 'next',
        'Swiping Right': 'next',
        'Thumb Up': 'confirm',
        'Thumb Down': 'cancel',
        'Swiping Down': 'undo',
        'Turning Hand Clockwise': 'delete',
        'Turning Hand Counterclockwise': 'delete'

    }
    return switcher.get(i, None)


@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.event
def my_message(sid, gesture):
    print('message:', gesture)
    msg = switcher(gesture)
    if msg == None:
        return
    if (msg[0].isupper()):
        message = jsonParser.encode(msg)
        if(message != None):
            sio.emit('my_message', message)
    elif (msg.lower() == 'undo'):
        sio.emit('my_message',jsonParser.undo())
    elif (msg.lower() == 'delete'):
        jsonParser.delete()
        sio.emit('my_message','delete')
    else:
        message = jsonParser.adjust(msg)
        if (message != None):
            sio.emit('my_message', message)

    #sio.emit('my_message',  data)
    print('send:', msg)

@sio.event
def server_event(sid, delete):
    print('server_event:', delete)
    jsonParser.delete()
    sio.emit('my_message','delete')

@sio.event
def disconnect(sid):
    print('disconnect ', sid)
    #very cheap solution to delete after connection was aborted
    jsonParser.delete()


if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 4999)), app)

#TODO Jones documentation of whole file