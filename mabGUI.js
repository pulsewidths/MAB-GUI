const { ipcRenderer } = require("electron");

class MabGUI
{
    constructor( )
    {

        this.stage = null;
        this.layer = null;

        this.assembly = new Assembly( this );

        this.initStage( );
        this.initListeners( );

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
                assembly.getComponent( componentName ).getPlace( oldName ).name = newName;
            } );
    }

    addComponent( pos )
    {
        this.assembly.addComponent( pos );
    }

    snapCoords( pos )
    {

        let snapIncrement = 10;

        return Math.round( pos / snapIncrement ) * snapIncrement;

    }
    
}

class Assembly
{

    constructor( )
    {

        this.componentList = [ ];
        this.selectedPlace = null;

    }

    addComponent( pos )
    {

        let name = 'Component_' + this.componentList.length + 1;
        let component = new Component( name, this, pos );

        this.componentList.push( component );

    }

    getComponent( name )
    {
        
        for( let index = 0; index < this.componentList.length; index++ )
        {
            if( this.componentList[ index ].name == name )
            {
                return this.componentList[ index ];
            }
        }
    }

    selectPlace( place )
    {
        this.selectedPlace = place;
        this.selectedPlace.shape.stroke( 'blue' );
        this.selectedPlace.shape.strokeWidth( 5 );
        this.selectedPlace.shape.draw( );
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
        mabGUI.layer.batchDraw( );

    }


}