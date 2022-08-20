const fs = require( 'fs' );

function generate( mabGUI )
{

    let assembly = mabGUI.assembly;

    for( let componentIndex = 0; componentIndex < assembly.components.length; componentIndex++ )
    {
        let component = assembly.components[ componentIndex ];
        let string = componentToString( component );
        exportComponentFile( string, component.name )
    }

    let string = assemblyToString( assembly );
    exportAssemblyFile( string );

}

function componentToString( component )
{

    let content = '';

    content += 'from mad import *\n';
    content += 'import time\n\n';
    content += 'class ' + capitalize( component.name ) + '(Component):\n';

    content += '\tdef create( self ):\n';
    content += '\t\tself.places = [\n';
    for( let placeIndex = 0; placeIndex < component.places.length; placeIndex++ )
    {
        let place = component.places[ placeIndex ];
        if( placeIndex == component.places.length - 1 ) {
            content += '\t\t\t' + place.name + '\n';
        } else {
            content += '\t\t\t' + place.name + ',\n';
        }
    }
    content += '\t\t]\n\n';

    content += '\t\tself.transitions = {\n';
    for( let transitionIndex = 0; transitionIndex < component.transitions.length; transitionIndex++ )
    {
        let transition = component.transitions[ transitionIndex ];
        if( transitionIndex == component.transitions.length - 1 )
        {
            content += '\t\t\t' + transition.name + ': (' + transition.source.name + ', ' + transition.destination.name + ', self.' + transition.func + ')\n';
        } else {
            content += '\t\t\t' + transition.name + ': (' + transition.source.name + ', ' + transition.destination.name + ', self.' + transition.func + '),\n';
        }
    }
    content += '\t\t}\n\n';

    content += '\t\tself.dependencies = {\n';

    if( component.dependencies.length != 0 )
    {
        for( let dependencyIndex = 0; dependencyIndex < component.dependencies.length; dependencyIndex++ )
        {
            let dependency = component.dependencies[ dependencyIndex ];
            if( dependency.source.type == 'place' &&
                !content.includes( dependency.name ) ) // provide
            {
                content += '\t\t\t' + dependency.name + ': (DepType.' + capitalize( dependency.serviceData ) + ', [' + dependency.source.name + '] ),\n';
            }
        }
        for( let dependencyIndex = 0; dependencyIndex < component.dependencies.length; dependencyIndex++ )
        {
            let dependency = component.dependencies[ dependencyIndex ];
            if( dependency.source.type == 'transition' &&
                !content.includes( dependency.name ) ) // provide
            {
                content += '\t\t\t' + dependency.name + ': (DepType.' + capitalize( dependency.serviceData ) + ', [' + dependency.source.name + '] ),\n';
            }
        }
        content = content.slice( 0, -2 );
        content += '\n\t\t}\n\n';
    } else {
        content += '\t\t}\n\n';
    }

    for( let transitionIndex = 0; transitionIndex < component.transitions.length; transitionIndex++ )
    {
        let transition = component.transitions[ transitionIndex ];
        let sleepTime = Math.floor( Math.random( ) * ( 11 ) );
        content += '\tdef ' + transition.func + '(self):\n';
        content += '\t\ttime.sleep(' + sleepTime + ')\n\n';
    }

    return content;

}

//Write the content string to a file
function exportComponentFile( content, componentName )
{

    fs.writeFile( componentName.toLowerCase( ) + '.py', content,
        function( error )
        {
            if( error )
            {
                alert( 'An error occured: ' + error );
            }
        }  );

};

function assemblyToString( assembly )
{
    let components = assembly.components;
    let content = '';

    content += 'from mad import *\n\n';
    for( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {
        let component = components[ componentIndex ];
        content += 'from ' + component.name.toLowerCase( ) + ' import ' + capitalize( component.name ) + '\n';
    }
    content += '\n';

    content += 'if __name__ == \'__main__\':\n';
    for( componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {
        let component = components[ componentIndex ];
        content += '\t' + component.name.toLowerCase( ) + ' = ' + capitalize( component.name ) + '()\n\n';
    }

    content += '\tassembly = Assembly()\n';
    for( componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {
        let component = components[ componentIndex ];
        content += '\tassembly.addComponent(' + component.name.toLowerCase( ) + ', ' + component.name.toLowerCase( ) + ')\n';
    }

    for( let connectionIndex = 0; connectionIndex < assembly.connections.length; connectionIndex++ )
    {
        let connection = assembly.connections[ connectionIndex ];
        content += '\tassembly.addConnection(' + connection.provide.component.name.toLowerCase( ) + ', ' + connection.provide.name + ', ' + connection.use.component.name.toLowerCase( ) + ', ' + connection.use.name + ')\n';
    }
    content += '\n';

    content += '\tmad = Mad(assembly)\n';
    content += '\tmad.run()\n';

    return content;

}

//Write the content string to a file
function exportAssemblyFile( content )
{

    fs.writeFile( 'assembly.py', content,
        function( error )
        {
            if( error )
            {
                alert( 'An error occured: ' + error );
            }
        } );

}

function capitalize( string )
{
    return string.charAt( 0 ).toUpperCase( ) + string.slice( 1 );
}

module.exports = generate;