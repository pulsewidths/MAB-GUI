const Konva = require( 'Konva' );
const { ipcRenderer } = require( 'electron' );
const dialog = require( 'electron' );

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

    // creates a test assembly; see index.html:37.
    test( )
    {
        this.assembly.addComponent( { x: 225, y: 163 } );
        this.assembly.addComponent( { x: 725, y: 163 } );

        for( let componentIndex = 0; componentIndex < this.assembly.components.length; componentIndex++ )
        {
            let place1 = this.assembly.components[ componentIndex ].addPlace( { x: 150, y: 150 } );
            let place2 = this.assembly.components[ componentIndex ].addPlace( { x: 150, y: 250 } );
            
            let transition = this.assembly.components[ componentIndex ].addTransition( place1, place2 );
        }


        
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
        ipcRenderer.on( 'changeComponentDetails-renderer',
            function( event, oldName, newName )
            {
                let component = mabGUI.assembly.getComponent( oldName );
                component.name = newName;
            } );
        // received from driver.js (main process), which received it from updatePlace.html
        ipcRenderer.on( 'changePlaceDetails-renderer',
            function( event, componentName, oldName, newName )
            {
                let place = mabGUI.assembly.getComponent( componentName ).getPlace( oldName );
                place.name = newName;
            } );
        // received from driver.js (main process), which received it from updateTransition.html
        ipcRenderer.on( 'changeTransitionDetails-renderer',
            function( event, componentName, oldName, args )
            {
                let transition = mabGUI.assembly.getComponent( componentName ).getTransition( oldName );
                transition.name = args.name;
                transition.func = args.func;
                transition.minDuration = args.minDuration;
                transition.maxDuration = args.maxDuration;
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
        this.stage.batchDraw( );
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

    }

    selectTransition( transition )
    {
        this.deselectAll( );
        this.selectedTransition = transition;
        this.selectedTransition.shape.stroke( 'blue' );
        this.selectedTransition.shape.strokeWidth( 3 );
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
    }

    selectDependency( dependency )
    {

        this.deselectAll( );
        this.selectedDependency = dependency;

        if( this.selectedDependency.source.type == 'transition' )
        {
            var highlightShape = this.selectedDependency.innerSymbol;
        } else if( this.selectedDependency.source.type == 'place' )
        {
            var highlightShape = this.selectedDependency.outerSymbol;
        }

        highlightShape.opacity( 0.5 );
        highlightShape.stroke( 'blue' );
        highlightShape.fill( 'blue' );
        highlightShape.strokeWidth( 3 );

    }

    deselectDependency( )
    {

        if( this.selectedDependency == null )
        {
            return;
        }

        if( this.selectedDependency.source.type == 'transition' ) // use
        {
            var highlightShape = this.selectedDependency.innerSymbol;
        }
        if( this.selectedDependency.source.type == 'place' ) // provide
        {
            var highlightShape = this.selectedDependency.outerSymbol;
        }

        highlightShape.stroke( 'black' );
        highlightShape.fill( 'black' );
        highlightShape.strokeWidth( 1 );

        if( this.selectedDependency.connections.length == 0 )
        {
            highlightShape.opacity( 0 );
        } else
        {
            highlightShape.opacity( 1 );
        }

        this.selectedDependency = null;

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

        return component;

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

        if( this.getConnection( provide, use ) )
        {
            return;
        }

        let connection = new Connection( provide, use );
        mabGUI.stage.batchDraw( );

        return connection;

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