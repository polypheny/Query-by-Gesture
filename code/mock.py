import socketio

import jsonParser

sio = socketio.Client()


def switcher(i):
    switcher = {
        # 4 types that are usable
        'TableScan': 'Drumming Fingers',
        'Join': 'Zooming In With Two Fingers',
        'Project': 'Pushing Hand Away',
        'Sort': 'Shaking Hand',
        'Filter': 'Stop Sign',
        # orientation gestures
        'next': 'Swiping Right',
        'confirm': 'Thumb Up',
        'cancel': 'Thumb Down',
        'undo': 'Swiping Down',
        'delete': 'Turning Hand Clockwise'

    }
    return switcher.get(i, None)


def printSwitch():
    for i in range(1, 10):
        print(i, ": ", switcher(i))


def send(msg):
    print('->', msg)
    sio.emit('my_message', msg)


def loop():
    while True:
        command = input()
        send(switcher(command))
        # if (command.lower() == "undo"):
        #     send(jsonParser.undo())
        # elif (command.lower() == "delete"):
        #     jsonParser.delete()
        #     send("delete")
        # else:
        #     send(jsonParser.encode(command))


def startConnenction():
    print("connection to server")
    global sio
    sio.connect('http://localhost:4999')
    send("Mock connected...")
    printSwitch()
    loop()


if __name__ == '__main__':
    startConnenction()
