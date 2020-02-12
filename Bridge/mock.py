import socketio

sio = socketio.Client()


def switcher(i):
    '''
    Switches the more intuitive commands to the corresponding gestures we defined in the API.
    :param i: User input as string.
    :return: Gesture connected to command that server understands command.
    '''
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
    if(msg != None):
        sio.emit('my_message', msg)


def loop():
    '''
    Main loop, which takes user input and sends it to the server.
    :return:
    '''
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
    '''
    Establishes connection to the server and waits for user input.
    :return:
    '''
    print("connection to server")
    global sio
    sio.connect('http://localhost:4999')
    send("Mock connected...")
    loop()


if __name__ == '__main__':
    startConnenction()
