const electron = require( 'electron' );
var app = electron.remote;
var dialog = app.dialog;

var yaml = require('js-yaml');

var fs = require('fs');

function saveAssembly( mabGUI )
{

    let saveableComponents = saveComponents( mabGUI.assembly.components );
    let saveableConnections = saveConnections( mabGUI.assembly.connections );
    let saveableList = [ saveableComponents, saveableConnections ];

    let saveContent = yaml.safeDump( saveableList );

    fileName = dialog.showSaveDialogSync(
        { defaultPath: "~/*.yaml",
          filters: [ { name: 'yaml', extensions: ['yaml'] } ]
        } );

    if ( fileName === undefined )
    {
        return;
    }

    fs.writeFileSync( fileName, saveContent );

}

function saveComponents( components )
{

    let saveableComponents = [];

    // saving each component
    for( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {

        let component = components[ componentIndex ];
        let saveableComponent  = componentToSaveObj( component );
        saveableComponents.push( saveableComponent );

    }

    return saveableComponents;

}

function saveConnections( connections )
{

        let saveableConnections = [];

        // saving each component
        for( let connectionIndex = 0; connectionIndex < connections.length; connectionIndex++ )
        {
            let connection = connections[ connectionIndex ];
            let saveableConnection = connectionToSaveObj( connection );
            saveableConnections.push( saveableConnection );
        }

        return saveableConnections;

}

function componentToSaveObj( component )
{

    let saveablePlaces = [];
    let saveableTransitions = [];
    let saveableDependencies = [];

    // saving each place in a component
    for( let placeIndex = 0; placeIndex < component.places.length; placeIndex++ )
    {
        let place = component.places[ placeIndex ];
        let saveablePlace = placeToSaveObj( place );
        saveablePlaces.push( saveablePlace );
    }

    // saving each transition in a component
    for( let transitionIndex = 0; transitionIndex < component.transitions.length; transitionIndex++ )
    {
        let transition = component.transitions[ transitionIndex ];
        let saveableTransition = transitionToSaveObj( transition );
        saveableTransitions.push( saveableTransition );
    }

    // saving each dependency into a component
    for( let dependencyIndex = 0; dependencyIndex < component.dependencies.length; dependencyIndex++ )
    {
        let dependency = component.dependencies[ dependencyIndex ];
        let saveableDependency = dependencyToSaveObj( dependency );
        saveableDependencies.push( saveableDependency );
    }

    return {
        type: component.type,
        name: component.name,
        places: saveablePlaces,
        transitions: saveableTransitions,
        dependencies: saveableDependencies,
        posX: component.shape.getAbsolutePosition().x,
        posY: component.shape.getAbsolutePosition().y,
        scaleX: component.shape.scaleX(),
        scaleY: component.shape.scaleY()
    };

}

function placeToSaveObj( place )
{

    return {
        type: place.type,
        name: place.name,
        index: place.index,
        posX: place.shape.getX(),
        posY: place.shape.getY()
    };

}

function transitionToSaveObj( transition )
{

    let saveableSourcePlace = placeToSaveObj( transition.source );
    let saveableDestinationPlace = placeToSaveObj( transition.destination );

    return {
        type: transition.type,
        name: transition.name,
        source: saveableSourcePlace,
        destination: saveableDestinationPlace,
        func: transition.func,
    };

}

function dependencyToSaveObj( dependency )
{

    let saveableSource;

    switch( dependency.source.type)
    {
        case "transition":
            saveableSource = transitionToSaveObj( dependency.source );
            break;
        case "place":
            saveableSource = placeToSaveObj( dependency.source );
            break;
    }

    return {
        type: dependency.type,
        serviceData: dependency.serviceData,
        name: dependency.name,
        index: dependency.index,
        source: saveableSource,
    };

}

function connectionToSaveObj( connection )
{

    saveableProvide = dependencyToSaveObj( connection.provide );
    saveableUse = dependencyToSaveObj( connection.use );

    return {
        provide: saveableProvide,
        use: saveableUse,
        provideComponentName: connection.provide.component.name,
        useComponentName: connection.use.component.name
    };

}

module.exports = saveAssembly;