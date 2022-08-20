// driver.js is ran in the main process (as opposed to the other .js files, in renderer/window context)

const electron = require( 'electron' );
const { app, BrowserWindow, Menu, ipcMain } = electron;
const Konva = require( 'Konva' );

const url = require( 'url' );
const path = require( 'path' );

const pluginManager = require( './JS/pluginManager.js' );

// on loading background stuff, run 'boot' function.
app.on( 'ready', boot );

// dev tools; comment this code to turn on/off.
process.env.NODE_ENV = 'development';

function boot( )
{

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

    Menu.setApplicationMenu( mainMenu );

}

// add all valid plugins to the 'plugins' menu dropdown.
function initPlugins( )
{

    // locate the plugins dropdown
    let pluginsMenuIndex = 0;
    while( pluginsMenuIndex < mainMenu.items.length )
    {
        if( mainMenu.items[ pluginsMenuIndex ].label == 'Plugins' )
        {
            break;
        }
        pluginsMenuIndex++;
    }

    for( let pluginIndex = 0; pluginIndex < pluginManager.length; pluginIndex++ )
    {

        let pluginObject = pluginManager[ pluginIndex ];

        const pluginEntry = new electron.MenuItem (
            { label: pluginObject.name,
            accelerator: 'CmdOrCtrl' + ( pluginIndex + 1 ),
            driverPath: pluginObject.path,
            pluginNumber: pluginIndex,
            message: pluginObject.name.toLocaleLowerCase( ).replace( / /g, '_' ),
                click( MenuItem )
                {
                    // let pluginStart = require ( './Plugins/' + pluginObject.name + '/driver.js' );
                    // pluginStart( mabGUI );
                    window.webContents.send( 'plugin-start', pluginObject );
                }
            }
        )

        mainMenu.items[ pluginsMenuIndex ].submenu.append( pluginEntry );

    }

}

function initListeners( )
{

    // caught from component.js's rmb event
    ipcMain.on( 'changeComponentDetails-createwindow',
        function( event, componentName )
        {

            var componentWindow = new BrowserWindow(
                {
                    width: 350, height: 200,
                    webPreferences: { nodeIntegration: true }
                } );
            componentWindow.loadURL( url.format( {
                pathname: path.join( __dirname, './HTML/updateComponent.html' ),
                protocol: 'file',
                slashes: true
            } ) );

            componentWindow.webContents.on( 'did-finish-load',
                function( event )
                {
                    // once the new window is loaded, send the new renderer the name of the component that's changing
                    componentWindow.webContents.send( 'changeComponentDetails-sendcomponenttowindow', componentName );
                } );

        } );
    // caught from place.js's rmb event
    ipcMain.on( 'changePlaceDetails-createwindow',
        function( event, componentName, placeName )
        {
            var placeWindow = new BrowserWindow(
                {
                    width: 350, height: 200,
                    webPreferences: { nodeIntegration: true }
                } );
            placeWindow.loadURL( url.format( {
                pathname: path.join( __dirname, './HTML/updatePlace.html' ),
                protocol: 'file:',
                slashes: true
            } ) );

            placeWindow.webContents.on( 'did-finish-load',
                function( event )
                {
                    placeWindow.webContents.send( 'changePlaceDetails-sendplacetowindow', componentName, placeName );
                } );
        } );
    ipcMain.on( 'changeTransitionDetails-createwindow',
        function( event, componentName, transitionName )
        {

            var transitionWindow = new BrowserWindow( 
                {
                    width: 470, height: 275,
                    webPreferences: { nodeIntegration: true }
                } );

            transitionWindow.loadURL( url.format( {
                pathname: path.join( __dirname, './HTML/updateTransition.html' ),
                protocol: 'file',
                slashes: true
            } ) );

            transitionWindow.webContents.on( 'did-finish-load',
                function( event )
                {
                    transitionWindow.send( 'changeTransitionDetails-sendtransitiontowindow', componentName, transitionName );
                } );

        } );
        ipcMain.on( 'changeDependencyDetails-createwindow',
            function( event, componentName, dependencyName )
            {
    
                var dependencyWindow = new BrowserWindow( 
                    {
                        width: 350, height: 200,
                        webPreferences: { nodeIntegration: true }
                    } );
    
                dependencyWindow.loadURL( url.format( {
                    pathname: path.join( __dirname, './HTML/updateDependency.html' ),
                    protocol: 'file',
                    slashes: true
                } ) );
    
                dependencyWindow.webContents.on( 'did-finish-load',
                    function( event )
                    {
                        dependencyWindow.send( 'changeDependencyDetails-senddependencytowindow', componentName, dependencyName );
                    } );
    
            } );

    // received from updateComponent.html's submission
    ipcMain.on( 'changeComponentDetails-updatename',
        function( event, oldName, newName )
        {
            // send information to primary renderer
            window.webContents.send( 'changeComponentDetails-renderer', oldName, newName );
        } );
    // received from updatePlace.html's submit button
    ipcMain.on( 'changePlaceDetails-updatename',
        function( event, componentName, oldName, newName )
        {
            // send information to primary renderer
            window.webContents.send( 'changePlaceDetails-renderer', componentName, oldName, newName )
        } );
    ipcMain.on( 'changeTransitionDetails-update',
        function( event, componentName, oldName, args )
        {
            window.webContents.send( 'changeTransitionDetails-renderer', componentName, oldName, args );
        } );
    ipcMain.on( 'changeDependencyDetails-updatename',
        function( event, componentName, oldName, newName )
        {
            window.webContents.send( 'changeDependencyDetails-renderer', componentName, oldName, newName );
        } );

    ipcMain.on( 'dependency-servicedataprompt',
        function( event )
        {
            const options = {
                buttons: [ 'Cancel', 'Service', 'Data' ],
                title: 'Select Dependency Type',
                message: 'Please select a type of dependency to create:'
            }
            let response = electron.dialog.showMessageBoxSync( options );
            if( response == 0 )
            {
                response = 'cancel';
            }
            if( response == 1 )
            {
                response = 'service';
            }
            if( response == 2 )
            {
                response = 'data';
            }

            event.returnValue = response;
        } );

    ipcMain.on( 'openSimulatorWindow',
        function( )
        {
            Menu.setApplicationMenu( this.simulatorMenu )
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