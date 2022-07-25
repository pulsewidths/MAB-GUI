const electron = require( 'electron' );
const url = require( 'url' );
const pluginManager = require( './JS/plugin_manager.js' ); // @todo: change filename
const path = require( 'path' );
const { constants } = require('http2');
const ipcMain = electron.ipcMain;

const { app, BrowserWindow, Menu } = electron;

// dev tools; comment this code to turn on/off.
process.env.NODE_ENV = 'development';

let window;
var placeArgs = 'global'; // @todo: argh... all of this... why?
var componentArgs = 'global';
var transitionArgs = 'global';
var stubArgs = 'global';

// on loading background stuff, run 'boot' function.
app.on( 'ready', boot );

function boot( )
{
	// create window.
	window = new BrowserWindow(
	{
		icon: path.join( __dirname, './Icons/logo.ico' ),
		webPreferences:
		{
			nodeIntegration: true,
			contextIsolation: false
		}
	} );

	// load initial canvas page.
	window.loadURL( url.format(
	{
		pathname: path.join( __dirname, './HTML/index.html' ),
		protocol: 'file:',
		slashes: true
	} ) );

	// create default menu from 'mainMenu' variable below.
	Menu.setApplicationMenu( mainMenu )

	populatePlugins( );

	initListeners( );

	// maximize window.
	window.maximize( )

	// cleanly close app.
	window.on( 'closed',
		function( )
		{
			app.quit( )
		}
	);

};

// add all valid plugins to the 'plugins' menu dropdown.
function populatePlugins( )
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

		console.log( mainMenu.items[ pluginsMenuIndex ] );
		mainMenu.items[ pluginsMenuIndex ].submenu.append( plugin );

		currentPluginNum++;

	}

}

// @todo: should this be refactored into the appropriate, individual .js files?
function initListeners( )
{
	ipcMain.on( 'enterSimulator',
		function( args )
		{
			Menu.setApplicationMenu( simulatorMenu ); // @todo: what exactly does this do?
		}
	);

	ipcMain.on( 'setDependencyType', // @todo: move this over to the root of each relevant .js file?
		function( event, args )
		{
			console.log( "Logging: setDependencyType from main thread." );
			const { dialog, MenuItem } = require( 'electron' );
			const options = {
				// type: 'question',
				buttons: [ 'Cancel', 'SERVICE', 'DATA' ],
				title: 'Question',
				message: 'Choose a dependency type: '
			};

			// @todo: clean this up somehow...?
			var dependencyType;
			let response = dialog.showMessageBox( options );
			switch( response )
			{
				case 0:
					dependencyType = 'Cancel';
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
		}
	);

	// place right-click.
	ipcMain.on( 'changePlaceDetails',
		function( event, args )
		{
			console.log( 'Logging: changePlaceDetails from main thread.' );
			placeArgs = args; // @todo: ?? why is this global?
			// create new window.
			var placeWindow = new BrowserWindow( { width: 350, height: 200 } );
			placeWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './HTML/changePlaceDetails.html' ), // @todo: update filename.
				protocol: 'file:',
				slashes: true
			} ) );
		}
	);

	// @todo: can this be compacted?
	ipcMain.on( 'place->main',
		function( event, args )
		{
			window.webContents.send( 'place->renderer', { component: placeArgs.component, place: placeArgs.place, name: args.name } );
		}
	);

	ipcMain.on( 'changeComponentDetails',
		function( event, args )
		{
			console.log( 'Logging: changeComponentDetails from main thread.' );
			componentArgs = args; // @todo: ?? why is this global?
			// create window.
			var componentWindow = new BrowserWindow( { width: 350, height: 200 } );
			componentWindow.loadURL( url.format( {
				pathname: path.join( __dirname, '.HTML/changeComponentDetails.html' ), // @todo: change filename elsewhere.
				protocol: 'file:',
				slashes: true
			} ) );

		}
	);

	ipcMain.on( 'component->main',
		function( event, args )
		{
			window.webContents.send( 'component->renderer', { componentName: componentArgs.componentName, name: args.name } ); // @todo: ??? what is this structure?
		}
	);

	ipcMain.on( 'changeTransitionDetails',
		function( event, args )
		{
			console.log( 'Logging: changeTransitionDetails from main thread.' );
			transitionArgs = args; // @todo: why is this global?
			var transitionWindow = new BrowserWindow( { width: 470, height: 275 } );
			transitionWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './HTML/changeTransitionDetails.html' ), // @todo: change filename elsewhere.
				protocol: 'file:',
				slashes: true
			} ) );
		}
	);

	ipcMain.on( 'transition->main',
		function( event, args )
		{
			window.webContents.send( 'transition->renderer', // @todo: this is ugly.
				{ component: transitionArgs.component, transition: transitionArgs.transition, oldName: transitionArgs.name,
				  name: args.name, oldFunc: transitionArgs.function, newFunc: args.function, newDurationMin: args.durationMin, newDurationMax: args.durationMax }
				);
		}
	);

	ipcMain.on( 'changeStubDetails',
		function( event, args )
		{
			console.log( 'Logging: changeStubDetails from main thread.' );
			stubArgs = args; // @todo: ?? why is this global?
			// create new window.
			var stubWindow = new BrowserWindow( { width: 350, height: 200 } );
			stubWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './HTML/changeStubDetails.html' ),
				protocol: 'file:',
				slashes: true
			} ) );
		}
	);

	ipcMain.on( 'stub->main',
		function( event, args )
		{
			console.log( args.name );
			window.webContents.send( 'stub->renderer', { component: stubArgs.component, oldName: stubArgs.stub, newName: args.name } ); // @todo: this is ugly.
		}
	);

	ipcMain.on( 'openUserManualWindow',
		function( event, args )
		{
			var userManualWindow = new BrowserWindow( );
			userManualWindow.setMenuBarVisibility( false );
			userManualWindow.loadURL( url.format( {
				pathname: path.join( __dirname, './Plugins/User Manual/userManual.html' ), // @todo: change filename elsewhere.
				protocol: 'file:',
				slashes: true
			} ) );
		}
	);

}

const mainMenu = Menu.buildFromTemplate(
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

const simulatorMenu = Menu.buildFromTemplate(
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


// if mac, add empty object to menu. @todo: reposition this?
if( process.platform == 'darwin' )
{
	mainMenu.items.unshift(
		{
	  		label: app.getName( ),
	  		submenu: [ { role: 'quit' } ]
		}
	);
 }

// add developer tools. @todo: reposition this?
if( process.env.NODE_ENV == 'development' )
{

	mainMenu.append( new electron.MenuItem( 
		{
			label: 'Developer Tools',
			submenu: [
				{
					label: 'Toggle DevTools',
					// dev tools + hotkey.
					accelerator:
						process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
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

}
