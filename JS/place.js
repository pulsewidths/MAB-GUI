// const { _numWithUnitExp } = require("gsap/gsap-core"); @todo: ??

class Place
{

    constructor( name, component, pos )
    {

        this.type = 'place';
        this.name = name;
        this.index = component.places.length;

        this.component = component;
        this.transitions = { in: [ ], out: [ ] }; // { in: [ ], out: [ ] }
        this.dependencies = [ ];

        this.initKonva( pos );
        this.initTooltip( );
        this.initListeners( );

        this.component.places.push( this );

    }

    initKonva( pos )
    {

        var component = this.component;

        this.shape = new Konva.Circle( 
            {
                x: pos.x, y: pos.y,
                radius: 30,
                stroke: 'black', strokeWidth: 1, fill: 'white',
                name: 'place',
                shadowBlue: 1,
                draggable: true,
                dragBoundFunc:
                    function( pos )
                    {
                        let x = pos.x;
                        let y = pos.y;
                        let minX = component.shape.getAbsolutePosition( ).x;
                        let maxX = minX + ( component.shape.getWidth( ) * component.shape.scaleX( ) );
                        let minY = component.shape.getAbsolutePosition( ).y;
                        let maxY = minY + ( component.shape.getHeight( ) * component.shape.scaleY( ) );
                        if( x < minX ) { x = minX; }
                        if( maxX < x ) { x = maxX; }
                        if( y < minY ) { y = minY; }
                        if( maxY < y ) { y = maxY; }
                        return ( { x: x, y: y } );
                    }
            }
        );

        this.component.group.add( this.shape );

    }

    initTooltip( )
    {

        this.tooltip = new Konva.Text( {
            text: '',
            fontFamily: 'Calibri', fontSize: 12,
            padding: 5,
            textFill: 'white', fill: 'black',
            alpha: 0.75, visible: false

        } );

        this.component.tooltipLayer.add( this.tooltip );

        mabGUI.stage.add( this.component.tooltipLayer ); // @todo: ?

    }

    initListeners( )
    {

        this.initLeftClickListeners( ); // single & double.
        this.initRightClickListeners( );
        this.initMovementListeners( );

    }

    initLeftClickListeners( )
    {

        var place = this;

        // single left-click.
        this.shape.on( 'click',
            function( event )
            {
                if( event.evt.button === 0 )
                {

                    if( mabGUI.selectedPlace == place )
                    {
                        mabGUI.deselectPlace( );
                        return;
                    }

                    mabGUI.deselectPlace( );
                    mabGUI.selectPlace( place );

                }
            } );

    }

    initRightClickListeners( )
    {
        
        let place = this;

        // rmb, no prior selection
        this.shape.on( 'click',
            function( event )
            {

                if( event.evt.button === 2 && mabGUI.selectedPlace == null )
                {

                    place.shape.stroke( 'blue' );
                    place.shape.strokeWidth( 3 );
                    place.shape.draw( );

                    ipcRenderer.send( 'changePlaceName-createwindow', place.component.name, place.name );
                    
                }

            } );

            // rmb, prior selection exists
            this.shape.on( 'click',
                function( event )
                {
                    if( event.evt.button === 2 && mabGUI.selectedPlace != null )
                    {

                        place.component.addTransition( mabGUI.selectedPlace, place );

                    }
                } );

            this.component.provideSelectionArea.on( 'click',
                function( event )
                {
                    if( event.evt.button == 2 && mabGUI.selectedPlace != null )
                    {
                        place.component.addDependency( mabGUI.selectedPlace );
                    }
                } );

    }

    initMovementListeners( )
    {

        let place = this;
        let remove = place.remove.bind( this );

        this.shape.on( 'dragend',
            function( event )
            {
                place.shape.position(
                    {
                        x: MabGUI.snapCoords( place.shape.x( ) ),
                        y: MabGUI.snapCoords( place.shape.y( ) )
                    } );
                place.tooltip.show( );
                mabGUI.layer.batchDraw( );
            } );

        this.shape.on( 'mousemove',
            function( )
            {
                let mousePos = mabGUI.stage.getPointerPosition( );
                place.tooltip.position(
                    {
                        x: mousePos.x + 10,
                        y: mousePos.y + 10
                    } );

                    place.tooltip.text( place.component.name + '-' + place.name );
                    place.tooltip.show( );

                    place.component.tooltipLayer.batchDraw( );
            } );

        this.shape.on( 'dragmove',
            function( )
            {
                place.tooltip.hide( );
            } );

        this.shape.on( 'mouseenter',
            function( )
            {
                mabGUI.stage.container( ).style.cursor = 'pointer';

                if( mabGUI.selectedPlace != null )
                {
                    if( place.component.validTransition( mabGUI.selectedPlace, place ) )
                    {
                        place.shape.stroke( 'green' );
                        place.shape.strokeWidth( 3 );
                        place.shape.draw( );
                    } else {
                        place.shape.stroke( 'red' );
                        place.shape.strokeWidth( 3 );
                        place.shape.draw( );
                    }
                }

                window.addEventListener( 'keydown', remove );
            } );

        this.shape.on( 'mouseleave',
            function( )
            {
                mabGUI.stage.container( ).style.cursor = 'default';

                if( mabGUI.selectedPlace != place )
                {
                    place.shape.stroke( 'black' );
                    place.shape.strokeWidth( 1 );
                    mabGUI.stage.batchDraw( );
                } else {
                    place.shape.stroke( 'blue' );
                    place.shape.strokeWidth( 5 );
                    mabGUI.stage.batchDraw( );
                }
            } );

        this.shape.on( 'mouseout',
            function( )
            {

                place.tooltip.hide( );
                place.component.tooltipLayer.draw( )

                window.removeEventListener( 'keydown', remove );

            } );

        this.component.provideSelectionArea.on( 'mouseover',
            function( )
            {
                if( mabGUI.selectedPlace != null )
                {
                    place.component.provideSelectionArea.fill( 'green' );
                    place.component.provideSelectionArea.opacity( 1 );
                    mabGUI.stage.batchDraw( );
                }
            } );

        this.component.provideSelectionArea.on( 'mouseout',
            function( )
            {
                if( place.component.provideSelectionArea.opacity( ) == 1 )
                {
                    place.component.provideSelectionArea.opacity( 0 );
                    mabGUI.stage.batchDraw( );
                }
            } );

    }

    remove( event )
    {

        if( event != null )
        {

            if( !( event.keyCode == 46 || event.keyCode == 8 ) )
            {
                return;
            }
            
            if( !confirm( 'Are you sure you want to delete this Place?' ) )
            {
                return;
            }

        }

        this.tooltip.destroy( );
        mabGUI.selectedPlace = null;

        while( this.dependencies.length != 0 )
        {
            this.dependencies[ 0 ].remove( );
        }
        while( this.transitions.in.length != 0 )
        {
            this.transitions.in[ 0 ].remove( ); 
        }
        while( this.transitions.out.length != 0 )
        {
            this.transitions.out[ 0 ].remove( ); 
        }

        let index = this.component.places.indexOf( this );
        this.component.places.splice( index, 1 );

        this.shape.destroy( );

    }

}
