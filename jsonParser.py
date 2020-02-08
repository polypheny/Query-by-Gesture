import json
import copy
from json import JSONEncoder

dict = {}
outerList = []
conList = []
counter = 0
lastNode = None
selected = None
joinIsSet = False

lastDict = {}
lastOuterList = []
lastConList = []
lastCounter = 0
lastLastNode = None

undoable = False

inNode = False
inType = False
operators = ['=', '<>', '<', '>', '<=', '>=']

height = 25
# left = 0, middle = 1, right = 2
split = False
leftmiddleright = 1


class Connection():
    '''
    Connection Class is adapted from Polypheny-UI
    An instance stores the target's and source's ID and their own ID,
    which consists of the concatenation of the two IDs.
    '''

    def __init__(self, source, target):
        self.id = str(source.id) + str(target.id)
        self.source = source
        self.target = target


class Node():
    '''
    Node Class is adapted from Polypheny-UI
    Represents the TS-object from the UI in this Python context. No changes were made.
    '''

    def __init__(self, ID, TYPE):
        pos = getPos(TYPE)
        self.id = ID
        self.type = TYPE
        self.left = pos[0]
        self.top = pos[1]
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
    '''
    Makes the two classes Node and Connection JSON serializable
    and returns a JSON string of the instance, which is encoded.
    '''

    def default(self, o):
        if isinstance(o, Node):
            return o.__dict__
        elif isinstance(o, Connection):
            return o.__dict__
        else:
            return json.JSONEncoder.default(self, o)


def getHeight(type):
    '''
    Return the height of each Node type in pixels.
    Is needed in the constructor of Node to specify the Node height,
     so no information gets cut out.
    '''
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


def getPos(type):
    '''
    Returns the coordinates of the node which is inserted.
    :param type of the node
    :return [x, y} coordinates
    '''
    global height
    global leftmiddleright

    global split
    top = height
    if (split):
        if (leftmiddleright == 0):
            left = 25
            leftmiddleright = 2

        else:
            left = 25 + leftmiddleright * 160
            height = height + getHeight(type) + 25
            leftmiddleright = 0
            if (type != 'Join'):
                split = False
                leftmiddleright = 1

    else:
        height = height + getHeight(type) + 25
        left = 25 + leftmiddleright * 160

    return [left, top]


def adaptLeft():
    '''
    repositions x cooridinate after join
    '''
    global split
    global leftmiddleright
    split = True
    leftmiddleright = 0


def encode(name: str):
    '''
    This is the core method of the encoding.
    It takes a string with the type of the Node, which has to be added to the Query Plan tree. Stores all the Nodes
    in the global node dictionary and all connections in the global connection list.
    :param name: The type of a node as string.
    :return: Encoded JSON string of the whole tree.
    '''

    global dict
    global outerList
    global counter
    global lastNode
    global conList
    global joinIsSet

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

    if (lastNode == None):
        '''
        Inputs the first Node of the tree.
        '''
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
            adaptLeft()
            inNode = True
            inType = True
        if (name == 'Filter'):
            inNode = True
        return NodeEncoder().encode(dict)
    else:
        '''
        All other nodes are appended here.
        '''
        node = Node("node" + str(counter), name)
        tup = (node.id, node)
        outerList.append(tup)
        dict["nodes"] = outerList

        if (lastNode.type == "Join" and joinIsSet == True):
            '''
            For more clarity see the elif block
            Appends the second child of a Join node - also resets the last node and the join boolean.
            '''

            connection = Connection(node, lastNode)
            conList.append((connection.id, connection))
            dict["connections"] = conList
            counter += 1
            lastNode = node
            joinIsSet = False
            print("second Join")

        elif (lastNode.type == "Join"):
            '''
            This if is needed to put in the first child node of a Join node.
            Since it is only possible to join two nodes in our implementation, the first Join-child can not have other 
            children.
            '''
            connection = Connection(node, lastNode)
            conList.append((connection.id, connection))
            dict["connections"] = conList
            counter += 1
            joinIsSet = True
            print("first Join")

        else:
            '''
            Appends every other node that is no Join.
            '''
            connection = Connection(node, lastNode)
            conList.append((connection.id, connection))
            dict["connections"] = conList
            counter += 1
            lastNode = node
            print("else")

        print(dict)
        print(lastDict)
        if (name == "Join"):
            '''
            is needed for the inner changes of a Join node - switching the operator and Join-Type
            '''
            adaptLeft()
            inNode = True
            inType = True

        if (name == 'Filter'):
            inNode = True
        return NodeEncoder().encode(dict)


def adjust(command: str):
    '''
    Adjusts inner attributes of Join or Filter nodes.
    :param command: The command name as string e.g. next, confirm etc.
    :return: Encoded JSON string of the whole updated tree.
    '''

    global inNode
    global inType
    global lastNode
    global operators

    if (not inNode):
        return None
    if (lastNode.type == 'Join' or lastNode.type == 'Filter'):
        if (inType):
            if (command == 'next'):
                if (lastNode.join == 'INNER'):
                    lastNode.join = 'OUTER'
                else:
                    lastNode.join = 'INNER'
                return NodeEncoder().encode(dict)
            elif (command == 'confirm'):
                inType = False
            elif (command == 'cancel'):
                reset()
                inType = False
                inNode = False
        else:
            if (command == 'next'):
                print(operators[1])
                lastNode.operator = operators[1]
                last = operators.pop(0)
                operators.append(last)
                print(operators)
                return NodeEncoder().encode(dict)
            elif (command == 'confirm'):
                inNode = False
            elif (command == 'cancel'):
                reset()
                inNode = False
    return None


def delete():
    '''
    Deletes the whole tree.
    :return: None
    '''
    global dict
    global outerList
    global conList
    global counter
    global lastNode

    global height
    global leftmiddleright
    global split

    height = 25
    leftmiddleright = 1
    split = 0

    dict = {}
    outerList = []
    conList = []
    counter = 0
    lastNode = None


def undo():
    '''
    Undoes the last node which was added. Can only undo the last node no more.
    :return: Encoded JSON string of the whole updated tree.
    '''
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

    global height

    print(dict)
    print(lastDict)

    if (undoable and lastLastNode == None):
        '''
        Checks if only one node is in tree - to prevent wrong entries in the undo data, everything gets deleted.
        '''
        delete()

    if (undoable):
        if(lastNode != lastLastNode):
            height = height - getHeight(lastNode.type) - 25
        dict = copy.deepcopy(lastDict)
        outerList = copy.deepcopy(lastOuterList)
        conList = copy.deepcopy(lastConList)
        counter = lastCounter
        lastNode = lastLastNode
        return NodeEncoder().encode(dict)


def verifyName(name: str):
    '''
    Eliminates all lower/upper case fault that may occure.
    :param name: The type of a node as string.
    :return: Corrected type of a node.
    '''
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
    '''
    Resets operators to given order of Polypheny-UI.
    :return: None
    '''
    global operators
    operators = ['=', '<>', '<', '>', '<=', '>=']
    return

