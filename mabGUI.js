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

    snapCoords( pos )
    {

        let snapIncrement = 10;

        return Math.round( pos / snapIncrement ) * snapIncrement;

    }

    selectPlace( place )
    {
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
        mabGUI.layer.draw( );

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