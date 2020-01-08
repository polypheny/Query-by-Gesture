import socketio

import jsonParser

sio = socketio.Client()


def switcher(i):
    switcher = {
        1: 'tablescan',
        2: 'join',
        3: 'filter',
        4: 'project',
        5: 'aggregate',
        6: 'sort',
        7: 'union',
        8: 'minus',
        9: 'intersect'
    }
    return switcher.get(i, "Invalid input")


def printSwitch():
    for i in range(1, 10):
        print(i, ": ", switcher(i))


def send(msg):
    print('->', msg)
    sio.emit('my_message', msg)


def loop():
    while True:
        command = input()
        if (command.lower() == "undo"):
            send(jsonParser.undo())
        elif (command.lower() == "delete"):
            jsonParser.delete()
            send("delete")
        else:
            send(jsonParser.encode(command))


def startConnenction():
    print("connection to server")
    global sio
    sio.connect('http://localhost:4999')
    send("Mock connected...")
    printSwitch()
    loop()


if __name__ == '__main__':
    startConnenction()
