class MabGUI
{
    constructor( )
    {

        this.stage = null;
        this.layer = null;

        this.assembly = new Assembly( this );

        this.initStage( );

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

    addComponent( pos )
    {
        this.assembly.addComponent( pos );
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

}