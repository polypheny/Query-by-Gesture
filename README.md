# Query by Gesture

This module provides a server which allows to build query plans in Polypheny-UI using gestures. It uses [Deepmime](http://deepmime.org) to recognize the gestures and uses websockets to communicate with Polypheny-UI.

## How to run it
To run the program, Polypheny-DB should be running. The easiest way to start Polypheny-DB is to use Polypheny Control. To learn more on Polypheny Control please visit: [Polypheny Control](https://github.com/polypheny/Polypheny-Control)

When Polypheny-DB is running, simply run the bash script provided in the root folder of this repository:

```bash
bash run.sh
```

If you want to disable the undo gesture, you can set the undo flag in the bash script:

```
python3 server.py [--undo {True, False}]
```

After running the command above, Deepmime will automatically connect to
the server when you start a live video. In Polypheny UI you must be in the Plan
Builder view to connect to the server. You can establish the connection by clicking
the button in the right menu. There you are also able to
change and save the IP and port (needs to be changed in server
and Deepmime as well). The deepmime interface will be running on:
`localhost:4444`

When everything is running and connected you can use the following gestures
to build a query:

**Operators**
- Drumming Fingers: TableScan
- Zooming In With Two Fingers: Join
- Zooming Out With Two Fingers: Join
- Pushing Hand Away: Project
- Pushing Hand In: Project
- Shaking Hand: Sort
- Stop Sign: Filter

**Navigation**
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
simply running: `python3 mock.py`

In the terminal you can then type in the commands (e.g. TableScan, confirm,
next etc.).

Example videos:

* Deepmime: https://youtu.be/2SVj17GXv7s
* Mock: https://youtu.be/DYrqiwcTzNs


## Contributing
We highly welcome your contributions to Polypheny UI. If you would like to contribute, please fork the repository and submit your changes as a pull request. Please consult our [Admin Repository](https://github.com/polypheny/Admin) for guidelines and additional information.

Please note that we have a [code of conduct](https://github.com/polypheny/Admin/blob/master/CODE_OF_CONDUCT.md). Please follow it in all your interactions with the project. 


## Acknowledgements
This first version of this module has been created by Jannik Jaberg and Jonas Rudin.


## License
The MIT License (MIT)
