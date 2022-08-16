const Konva = require( 'Konva' );
const { ipcRenderer } = require("electron");

// mabGUI runs from the renderer process, called by index.html 
class MabGUI
{
    constructor( )
    {

        this.stage = null;
        this.layer = null;

        this.assembly = new Assembly( this );

        this.initStage( );
        this.initListeners( );

        this.selectedPlace = null;
        this.selectedTransition = null;
        this.selectedDependency = null;

    }

    initStage( )
    {

        let CANVAS_SIZE = { w: 3840, h: 2160 };

        this.stage = new Konva.Stage( {
            container: 'canvas',
            width: CANVAS_SIZE.w, height: CANVAS_SIZE.h
        } );

        this.layer = new Konva.Layer( );

        this.stage.add( this.layer );

    }

    initListeners( )
    {

        let assembly = this.assembly;
        
        // received from driver.js (main process), which received it from updateComponent.html
        ipcRenderer.on( 'changeComponentName-renderer',
            function( event, oldName, newName )
            {

                assembly.getComponent( oldName ).name = newName;

            } );

        // received from driver.js (main process), which received it from updatePlace.thml
        ipcRenderer.on( 'changePlaceName-renderer',
            function( event, componentName, oldName, newName )
            {
                assembly.getComponent( componentName ).findPlace( oldName ).name = newName;
            } );
    }

    static snapCoords( pos )
    {

        let snapIncrement = 10;

        return Math.round( pos / snapIncrement ) * snapIncrement;

    }

    deselectAll( )
    {
        this.deselectPlace( );
        this.deselectTransition( );
        this.deselectDependency( );
    }

    selectPlace( place )
    {
        this.deselectAll( );
        this.selectedPlace = place;
        this.selectedPlace.shape.stroke( 'blue' );
        this.selectedPlace.shape.strokeWidth( 5 );
        this.stage.batchDraw( );
    }

    deselectPlace( )
    {
        if( this.selectedPlace == null )
        {
            return;
        }

        this.selectedPlace.shape.stroke( 'black' );
        this.selectedPlace.shape.strokeWidth( 1 );
        this.selectedPlace = null;
        this.stage.batchDraw( );

    }

    selectTransition( transition )
    {
        this.deselectAll( );
        this.selectedTransition = transition;
        this.selectedTransition.shape.stroke( 'blue' );
        this.selectedTransition.shape.strokeWidth( 3 );
        this.stage.batchDraw( );
    }
    
    deselectTransition( )
    {
        if( this.selectedTransition == null )
        {
            return;
        }

        this.selectedTransition.shape.stroke( 'black' );
        this.selectedTransition.shape.strokeWidth( 1 );
        this.selectedTransition = null;
        this.stage.batchDraw( );
    }

    selectDependency( dependency )
    {

        this.deselectAll( );
        this.selectedDependency = dependency;
        this.selectedDependency.stub.opacity( 0.5 );
        this.selectedDependency.stub.stroke( 'blue' );
        this.selectedDependency.stub.fill( 'white' );
        this.selectedDependency.stub.strokeWidth( 3 );
        this.stage.batchDraw( );

    }

    deselectDependency( )
    {

        if( this.selectedDependency == null )
        {
            return;
        }

        if( this.selectedDependency.source.type == 'transition' ) // use
        {
            this.selectedDependency.stub.opacity( 0 );
        }
        if( this.selectedDependency.source.type == 'place' )
        {
            this.selectedDependency.stub.opacity( 1 );
        }

        this.selectedDependency.stub.stroke( 'black' );
        this.selectedDependency.stub.fill( 'black' );
        this.selectedDependency.stub.strokeWidth( 1 );
        this.selectedDependency = null;
        this.stage.batchDraw( );

    }

}

class Assembly
{

    constructor( )
    {

        this.components = [ ];

    }

    addComponent( pos )
    {

        let name = 'Component_' + this.components.length + 1;
        let component = new Component( name, pos );
        mabGUI.stage.batchDraw( );

    }

    addConnection( dependency1, dependency2 )
    {

        if( dependency1.source.type == 'place' &&
            dependency2.source.type == 'transition' ) // provide
        {
            var provide = dependency1;
            var use = dependency2;
        }
        else if( dependency1.source.type == 'transition' &&
                 dependency2.source.type == 'place' )
        {
            var provide = dependency2;
            var use = dependency1;
        }
        else
        {
            return;
        }

        // connection already exists.
        console.log( this.getConnection( provide, use ) );
        if( this.getConnection( provide, use ) )
        {
            console.log( 'already exists!' );
            return;
        }

        let connection = new Connection( provide, use );
        mabGUI.stage.batchDraw( );

    }

    getConnection( provide, use )
    {
        for( let componentIndex = 0; componentIndex < this.components.length; componentIndex++ )
        {
            let component = this.components[ componentIndex ];
            for( let connectionIndex = 0; connectionIndex < component.connections.provide.length; connectionIndex++ )
            {
                let connection = component.connections.provide[ connectionIndex ];
                console.log( connection );
                if( connection.provide == provide && connection.use == use )
                {
                    return connection;
                }
            }
        }
        return null;
    }

    getComponent( name )
    {
        
        for( let index = 0; index < this.components.length; index++ )
        {
            if( this.components[ index ].name == name )
            {
                return this.components[ index ];
            }
        }
    }

}