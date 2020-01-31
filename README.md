# Query by Gesture Bridge
Middleware to connect [Deepmime](http://deepmime.org/) (gesture recognition) with Polypheny. It allows building and executing query plans by gestures.

## How to run it ##
To run the program, Deepmime, Polypheny and the server (Query by Gesture
Bridge) must be run individually. It is recommended to start the server first. For
this you have to run the following comands:

`pip3 install python-socketio`

`python3 server.py [--undo {True, False}]`

If you want to diable the undo function, you can set the undo flag.

After that you can run Polypheny and Deepmime. Open the two applications
in different browser windows or tabs. Deepmime will automatically connect to
the server when you start a live video. In Polypheny you must be in the Plan
Builder to connect to the server in the settings. There you are also able to
change and save the IP and port (needs to be changed in server
and Deepmime as well)

When everything is running and connected you can use the following gestures
to build a query:

**operators**
- Drumming Fingers: TableScan
- Zooming In With Two Fingers: Join
- Zooming Out With Two Fingers: Join
- Pushing Hand Away: Project
- Pushing Hand In: Project
- Shaking Hand: Sort
- Stop Sign: Filter

**navigation**
- Swiping Left: next
- Swiping Right: next
- Thumb Up: confirm
- Thumb Down: cancel
- Swiping Down: undo
- Swiping Up: undo
- Turning Hand Clockwise: delete
- Turning Hand Counterclockwise: delete

There are some things you need to know when building your query. The "Join"
and "Filter" operators have two respectively one additional fields you have to
specify via gesture control. You can do this via "next" (which goes through
the possible options) and "confirm" (selects the shown option). Additionally the
"undo" will delete the last inserted operator and the "delete" will get rid of the
whole query.
If you only want to insert queries without running it in the end it is enough if
you run Polypheny-UI with ng serve. Furthermore you can mock Deepmime by
simply running:
python3 mock . py
In the terminal you can then type in the commands (e.g. TableScan, confirm,
next etc.).

Example videos:

* Deepmime: https://youtu.be/2SVj17GXv7s
* Mock: https://youtu.be/DYrqiwcTzNs


## Contributing ##
We highly welcome your contributions to Polypheny UI. If you would like to contribute, please fork the repository and submit your changes as a pull request. Please consult our [Admin Repository](https://github.com/polypheny/Admin) for guidelines and additional information.

Please note that we have a [code of conduct](https://github.com/polypheny/Admin/blob/master/CODE_OF_CONDUCT.md). Please follow it in all your interactions with the project. 

## License ##
The MIT License (MIT)
