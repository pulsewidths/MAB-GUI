const electron = require('electron');
const fs = require('fs');
const app = electron.remote;
const dialog = app.dialog;
const yaml = require('js-yaml');

function loadAssembly( mabGUI )
{

    fileName = dialog.showOpenDialogSync(
        { properties: ['showHiddenFiles'],
          filters: [ { name: 'yaml', extensions: ['yaml'] } ]
    } );

    if ( fileName === undefined )
    {
        return;
    }

    clear();

    let rawData = fs.readFileSync( fileName.toString( ) );
    let parsedData = yaml.safeLoadAll( rawData )[ 0 ];
    let componentData = parsedData[ 0 ];
    let connectionData = parsedData[ 1 ];

    loadComponents( mabGUI, componentData );
    loadPlaces( mabGUI, componentData );
    loadTransitions( mabGUI, componentData );
    loadDependencies( mabGUI, componentData );
    loadConnections( mabGUI, connectionData );

}

function clear() {

    while( mabGUI.assembly.components.length != 0) {
        mabGUI.assembly.components[ 0 ].remove( );
    }

}

function loadComponents( mabGUI, components )
{

    // load components
    for( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {

        let loadedComponent = components[ componentIndex ];

        let posX = loadedComponent.posX;
        let posY = loadedComponent.posY;
        let scaleX = loadedComponent.scaleX;
        let scaleY = loadedComponent.scaleY;

        // create component in GUI, modify scale and position correctly
        let component = mabGUI.assembly.addComponent( { x: posX, y: posY } );
        
        component.shape.scaleX( scaleX );
        component.shape.scaleY( scaleY );
        component.name = loadedComponent.name;

        // fire component event listener
        // component_obj.konva_component.fire('xChange'); // @todo: ??

        mabGUI.layer.batchDraw();

    }

}

function loadPlaces( mabGUI, components )
{

    // load places
    for( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {

        let loadedComponent = components[ componentIndex ]; // components parsed from .yaml file, which has info about places
        let component = mabGUI.assembly.components[ componentIndex ]; // global components in which we will add places

        for( let placeIndex = 0; placeIndex < loadedComponent.places.length; placeIndex++ )
        {

            let loadedPlace = loadedComponent.places[ placeIndex ];

            let place = component.addPlace( { x: loadedPlace.posX, y: loadedPlace.posY } );
            place.name = loadedPlace.name;

            mabGUI.layer.batchDraw();
        }

    }

}

function loadTransitions( mabGUI, components )
{

    // load transitions
    for( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {

        let loadedComponent = components[ componentIndex ]; // components parsed from .yaml file, which has info about transitions
        let component = mabGUI.assembly.components[ componentIndex ]; // global components in which we will add transitions

        for( let transitionIndex = 0; transitionIndex < loadedComponent.transitions.length; transitionIndex++ )
        {

            let loadedTransition = loadedComponent.transitions[ transitionIndex ];

            let source = component.getPlace( loadedTransition.source.name );
            let destination = component.getPlace( loadedTransition.destination.name );

            let transition = component.addTransition( source, destination );
            transition.name = loadedTransition.name;

        }

    }

}

function loadDependencies( mabGUI, components )
{

    for( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {

        let loadedComponent = components[ componentIndex ];
        let component = mabGUI.assembly.components[ componentIndex ];

        for( let dependencyIndex = 0; dependencyIndex < loadedComponent.dependencies.length; dependencyIndex++ )
        {

            let loadedDependency = loadedComponent.dependencies[ dependencyIndex ];

            if( loadedDependency.source.type == 'transition' )
            {
                var source = component.getTransition( loadedDependency.source.name );
            } else if( loadedDependency.source.type == 'place' )
            {
                var source = component.getPlace( loadedDependency.source.name );
            }

            var dependency = component.addDependency( source, loadedDependency.serviceData );

            dependency.name = loadedDependency.name;

        }

    }

};

function loadConnections( mabGUI, connections )
{

    for( let connectionIndex = 0; connectionIndex < connections.length; connectionIndex++ )
    {

        let loadedConnection = connections[ connectionIndex ];

        // get components
        let provideComponent = mabGUI.assembly.getComponent( loadedConnection.provideComponentName );
        let useComponent = mabGUI.assembly.getComponent( loadedConnection.useComponentName );

        // get provide stuff
        let provideDependency = provideComponent.getDependency( loadedConnection.provide.name );

        // get use stuff
        let useDependency = useComponent.getDependency( loadedConnection.use.name );

        let connection = mabGUI.assembly.addConnection( provideDependency, useDependency );

        connection.name = loadedConnection.name;

    }

}

module.exports = loadAssembly;