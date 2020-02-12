import json
import copy
from json import JSONEncoder

dict = {}
outerList = []
conList = []
counter = 0
lastNode = None
selected = None

lastDict = {}
lastOuterList = []
lastConList = []
lastCounter = 0
lastLastNode = None

undoable = False

inNode = False
inType = False
operators = ['=', '<>', '<', '>', '<=', '>=']


class Connection():
    def __init__(self, source, target):
        self.id = str(source.id) + str(target.id)
        self.source = source
        self.target = target


class Node():
    def __init__(self, ID, TYPE):
        self.id = ID
        self.type = TYPE
        self.left = 50
        self.top = 50
        self.children = []
        self.inputCount = 0
        self.acColumns = {}
        self.acTableColumns = {}
        self.acSchema = {}
        self.acTable = {}
        self.zIndex = 1
        self.join = "INNER"
        self.operator = "="
        self.fields = [
            ""
        ]
        self.aggregation = "SUM"
        self.sortColumns = [
            {
                "direction": "DESC",
                "sorting": False,
                "column": ""
            }
        ]
        self.all = False
        self.dragging = False

        self.height = getHeight(self.type)
        self.width = 260


class NodeEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, Node):
            return o.__dict__
        elif isinstance(o, Connection):
            return o.__dict__
        else:
            return json.JSONEncoder.default(self, o)


def getHeight(type):
    switcher = {
        'TableScan': 95,
        'Join': 232,
        'Filter': 186,
        'Project': 134,
        'Aggregate': 232,
        'Sort': 134,
        'Union': 94,
        'Minus': 94,
        'Intersect': 94
    }
    return switcher.get(type, 260)


def encode(name: str):
    global dict
    global outerList
    global counter
    global lastNode
    global conList

    global lastDict
    global lastOuterList
    global lastConList
    global lastCounter
    global lastLastNode

    global undoable

    global inNode
    global inType

    if (inNode):
        return None

    lastDict = copy.deepcopy(dict)
    lastOuterList = copy.deepcopy(outerList)
    lastConList = copy.deepcopy(conList)
    lastCounter = counter
    lastLastNode = lastNode

    print(dict)
    print(lastDict)

    undoable = True

    '''
    if (verifyName(name) == 'invalid'):
        print("Input is invalid")
        return
    else:
        name = verifyName(name)
    '''

    if (lastNode == None):
        node = Node("node" + str(counter), name)
        tup = (node.id, node)
        outerList.append(tup)
        dict["nodes"] = outerList
        dict["connections"] = []
        counter += 1
        lastNode = node

        print(dict)
        print(lastDict)
        if (name == "Join"):
            inNode = True
            inType = True
        if (name == 'Filter'):
            inNode = True
        return NodeEncoder().encode(dict)
    else:
        node = Node("node" + str(counter), name)
        tup = (node.id, node)
        outerList.append(tup)
        dict["nodes"] = outerList

        connection = Connection(node, lastNode)
        conList.append((connection.id, connection))
        dict["connections"] = conList
        counter += 1
        lastNode = node

        print(dict)
        print(lastDict)
        if (name == "Join"):
            inNode = True
            inType = True

        if (name == 'Filter'):
            inNode = True
        return NodeEncoder().encode(dict)


def adjust(command: str):
    global inNode
    global inType
    global lastNode
    global operators
    if (not inNode):
        return None
    if (lastNode.type == 'Join'):
        if (inType):
            if (command == 'next'):
                if (lastNode.join == 'INNER'):
                    lastNode.join = 'OUTER'
                else:
                    lastNode.join = 'INNER'
                return NodeEncoder().encode(dict)
            if (command == 'confirm'):
                inType = False
            if (command == 'cancel'):
                reset()
                inType = False
                inNode = False
        else:
            if (command == 'next'):
                print(operators[0])
                lastNode.operator = operators[1]
                last = operators.pop(0)
                operators.append(last)
                return NodeEncoder().encode(dict)
            if (command == 'confirm'):
                inNode = False
            if (command == 'cancel'):
                reset()
                inNode = False

def delete():
    global dict
    global outerList
    global conList
    global counter
    global lastNode

    dict = {}
    outerList = []
    conList = []
    counter = 0
    lastNode = None


def undo():
    global undoable
    global dict
    global outerList
    global conList
    global counter
    global lastNode

    global lastDict
    global lastOuterList
    global lastConList
    global lastCounter
    global lastLastNode

    print(dict)
    print(lastDict)

    if (undoable):
        dict = copy.deepcopy(lastDict)
        outerList = copy.deepcopy(lastOuterList)
        conList = copy.deepcopy(lastConList)
        counter = lastCounter
        lastNode = lastLastNode
        return NodeEncoder().encode(dict)


def verifyName(name: str):
    switcher = {
        'tablescan': 'TableScan',
        'join': 'Join',
        'filter': 'Filter',
        'project': 'Project',
        'aggregate': 'Aggregate',
        'sort': 'Sort',
        'union': 'Union',
        'minus': 'Minus',
        'intersect': 'Intersect'
    }

    return switcher.get(name.lower(), 'invalid')


def reset():
    global operators
    operators = ['=', '<>', '<', '>', '<=', '>=']
    return


if __name__ == '__main__':
    print(inNode)
    print(encode('Join'))
    print(inNode)
    print(adjust('next'))
    print(adjust('next'))
    print(adjust('confirm'))
    print(adjust('next'))