const electron = require( 'electron' );
const { app, BrowserWindow, Menu } = electron;
const ipcMain = electron.ipcMain;
const remote = electron.remote;
const url = require( 'url' );
const path = require( 'path' );
// const { constants } = require('http2'); @todo: ??
const Konva = require( 'Konva' );
const Component = require( './JS/component.js' );

const pluginManager = require( './JS/pluginManager.js' ); // @todo: change filename

// on loading background stuff, run 'boot' function.
app.on( 'ready', boot );

function boot( )
{
	
	// dev tools; comment this code to turn on/off.
	process.env.NODE_ENV = 'development';

	window = new BrowserWindow( 
		{
			icon: path.join( __dirname, './icons.ico' ),
			webPreferences:
			{
				nodeIntegration: true,
				contextIsolation: false // @todo: interesting...
			}
		} );

	window.loadURL( url.format(
		{
			pathname: path.join( __dirname, './HTML/index.html' ),
			protocol: 'file:',
			slashes: true
		} ) );

	initMenu( );
	initListeners( );

	window.maximize( );
	window.on( 'closed',
		function( )
		{
			app.quit( );
		} );

};

function initMenu( )
{

    mainMenu = Menu.buildFromTemplate(
		[
			{
				label: 'File',
				submenu: [
				{
					// quit + hotkey.
					label: 'Quit',
					accelerator:
						process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
						click( ) { app.quit( ); }
				}
				]
			},
			{
				label: 'Plugins',
				submenu: [ ]
			}
		]
	);

	simulatorMenu = Menu.buildFromTemplate(
		[
			{
				label: 'File',
				submenu: [
				{
					// quit + hotkey.
					label: 'Quit',
					accelerator: // @todo: why is this formatted differently than below?
						process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
						click( ) { app.quit( ); }
				}
				]
			},
			{
				label: 'Exit Simulator Mode',
					click( )
					{
						// send 'exit' signal to renderer.
						window.webContents.send( 'exitSimulator' ); // @todo: change exit_simulator to exitSimulator elsewhere.
						// reset menu.
						Menu.setApplicationMenu( mainMenu );
					}
			}
		]
	);

	Menu.setApplicationMenu( mainMenu );

	if( process.platform == 'darwin' )
	{
		mainMenu.items.unshift(
			{
				label: app.getName( ),
				submenu: [ { role: 'quit' } ]
			}
		);
	}

    if( process.env.NODE_ENV == 'development' )
    {
        initDeveloperMenu( );
    }

	initPlugins( );

}

function initDeveloperMenu( )
{

    mainMenu.append( new electron.MenuItem( 
        {
            label: 'Developer Tools',
            submenu: [
                {
                    label: 'Toggle DevTools',
                    // dev tools + hotkey
                    accelerator:
                        process.platform == 'darwin' ? 'Commangs+I' : 'Ctrl+I',
                        click( item, focusedWindow )
                        {
                            focusedWindow.toggleDevTools( );
                        }
                },
                {
                    role: 'reload'
                }
            ]
        }
    ) );

	Menu.setApplicationMenu( mainMenu );

}
	
// add all valid plugins to the 'plugins' menu dropdown.
function initPlugins( )
{

	// locate the 'plugins' dropdown in the main menu.
	var pluginsMenuIndex = 0;
	while( pluginsMenuIndex < mainMenu.items.length )
	{

		if( mainMenu.items[ pluginsMenuIndex ].label == 'Plugins' )
		{
			break;
		}

			pluginsMenuIndex++;

	}
	
	// populate from pluginManager.
	var currentPluginNum = 0; // @todo: better name?
	while( currentPluginNum < pluginManager[ 0 ].length ) // @todo: what is this array structure? @todo: change name of pluginManager elsewhere.
	{

		const plugin = new electron.MenuItem
		( {
			label: pluginManager[ 0 ][ currentPluginNum ],
			accelerator: 'CmdOrCtrl+' + currentPluginNum, // @todo: increment by one? @todo: why is this accelerator format different than above?
			driverPath: pluginManager[ 1 ][ currentPluginNum ],
			pluginNumber: currentPluginNum,
			message: pluginManager[ 0 ][ currentPluginNum ].toLocaleLowerCase( ).replace( / /g, '_' ),
				click( MenuItem )
				{
					window.webContents.send( MenuItem.message );
					console.log( 'The ' + MenuItem.label + ' plugin has been activated.' );
				}
		} );

		mainMenu.items[ pluginsMenuIndex ].submenu.append( plugin );

		currentPluginNum++;

	}

}

function initListeners( )
{

	// caught from component.js's rmb event
	ipcMain.on( 'updateComponent',
		function( event, component )
		{
			var componentWindow = new BrowserWindow( { width: 350, height: 200 } );
			componentWindow.component = component;
			componentWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './HTML/updateComponent.html' ),
				protocol: 'file',
				slashes: true
			} ) );
		} );
	ipcMain.on( 'openSimulatorWindow',
		function( )
		{
			Menu.setApplicationMenu( this.simulatorMenu )
		} );

	ipcMain.on( 'openDependencyTypeWindow',
		function( event )
		{
			const { dialog, MenuItem } = require( 'electron' );
			const options = {
				// type: 'question',
				buttons: [ 'Cancel', 'Service', 'Data' ],
				title: 'Question',
				message: 'Choose a dependency type'
			};

			// @todo: clean this up...?
			var dependencyType
			let response = dialog.showMessageBox( options );
			switch( response )
			{
				case 0:
					dependencyType = 'Cancel'
					break;
				case 1:
					dependencyType = 'Service';
					break;
				case 2:
					dependencyType = 'Data';
					break;
				default:
					dependencyType = 'Cancel';
			}
			event.returnValue = dependencyType;
		} );

	ipcMain.on( 'openPlaceDetailsWindow',
		function( )
		{
			var placeWindow = new BrowserWindow( { width: 350, height: 200 } );
			placeWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './HTML/changePlaceDetails.html' ), // @todo: update filename?
				protocol: 'file:',
				slashes: true
			} ) );
		} );

	ipcMain.on( 'place->main',
		function( event, args )
		{
			window.webContents.send( 'place->renderer',
				{ component: placeArgs.component, place: placeArgs.place, name: args.name } );
			
		}
	);

	ipcMain.on( 'transition->main',
		function( event, args )
		{
			window.webContents.send( 'transition->renderer',
			{ component: transitionArgs.component, transition: transitionArgs.transition, oldName: transitionArgs.name,
			name: args.name, oldFunc: transitionArgs.function, newFunc: args.function, newDurationMin: args.durationMin, newDurationMax: args.durationMax }
			);
		} );

	ipcMain.on( 'changeStubDetails',
		function( event, args )
		{
			stubArgs = args;
			var stubWindow = new BrowserWindow( { width: 350, height: 200 } );
			stubWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './HTML/changeStubDetails.html '),
				protocol: 'file:',
				slashes: true
			} ) );
		} );

	ipcMain.on( 'stub->main',
		function( args )
		{
			window.webContents.send( 'stub->renderer', {component: stubArgs.component, oldName: stubArgs.stub, newName: args.name } );
		} );

	ipcMain.on( 'openUserManualWindow',
		function( )
		{
			var userManualWindow = new BrowserWindow( );
			userManualWindow.setMenuBarVisibility( false );
			userManualWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './Plugins/User Manual/userManual.html' ),
				protocol: 'file:',
				slashes: true
			} ) );
		} );

}