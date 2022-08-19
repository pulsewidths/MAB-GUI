class Transition
{
    constructor( name, source, destination, func )
    {

        this.type = 'transition';
        this.name = name;
        this.index = source.component.transitions.length;

        this.source = source;
        this.destination = destination;
        this.func = func;

        this.component = source.component;
        this.dependencies = [ ]; // 3 max

        this.currentDuration = 0;
        this.minDuration = 1;
        this.maxDuration = 2;

        this.initOffset( );

        this.initKonva( );
        this.initTooltip( );
        this.initListeners( );

        this.component.transitions.push( this );    
        this.source.transitions.out.push( this );
        this.destination.transitions.in.push( this );

    }

    initKonva( )
    {

        this.group = new Konva.Group( {
            name: 'transitionGroup'
        } );

        this.shape = new Konva.Line( {
            points: [ this.source.shape.getX( ), this.source.shape.getY( ),
                      ( ( this.source.shape.getX( ) + this.destination.shape.getX( ) ) / 2 ) + this.offset,
                      ( ( this.source.shape.getY( ) + this.destination.shape.getY( ) ) / 2 ),
                          this.destination.shape.getX( ), this.destination.shape.getY( ) ],
            stroke: 'black', strokeWidth: 1,
            name: 'transition', tension: 1
        } );

        this.selectShape = new Konva.Circle( {
            x: ( ( this.source.shape.getX( ) + this.destination.shape.getX( ) ) / 2 ) + this.offset,
            y: ( this.source.shape.getY( ) + this.destination.shape.getY( ) ) / 2,
            name: 'transition', text: this.name,
            stroke: 'black', fill: 'white',
            radius: 10, opacity: 0, fill: 'white'
        } );

        this.group.add( this.shape );
        this.group.add( this.selectShape );
        this.component.group.add( this.group );

        this.source.shape.moveToTop( );
        this.destination.shape.moveToTop( );

    }

    initTooltip( )
    {

        this.tooltip = new Konva.Text( {
            text: '', fontFamily: 'Calibri', fontSize: 12,
            textFill: 'white', fill: 'black', alpha: 0.75, visible: false,
            padding: 5
        } );

        this.component.tooltipLayer.add( this.tooltip );

    }

    initOffset( )
    {

        let offsetList = [ 0, 30, -30, 60, -60 ];

        for (let outIndex = 0; outIndex < this.source.transitions.out.length; outIndex++ )
        {

            if ( this.source.transitions.out[ outIndex ].destination == this.destination )
            {
                let foundOffset = this.source.transitions.out[ outIndex ].offset;
                let foundOffsetIndex = offsetList.indexOf( foundOffset );
                if( foundOffsetIndex != -1 )
                {
                    offsetList.splice( foundOffsetIndex, 1 );
                }
            }

        }

        this.offset = offsetList[ 0 ];

    }

    initListeners( )
    {

        let leftClickListener = this.leftClickListener.bind( this );

        this.selectShape.on( 'click', leftClickListener );

        this.initRightClickListeners();
        this.initMovementListeners();

    }

    leftClickListener( event )
    {

        if( event.evt.button == 0 )
        {

            if( mabGUI.selectedTransition == this )
            {
                mabGUI.deselectTransition( );
                return;
            }
            
            mabGUI.deselectTransition( );
            mabGUI.selectTransition( this );
        }

    }

    initRightClickListeners( )
    {

        let transition = this;

        this.selectShape.on( 'click',
            function( event )
            {

                if( event.evt.button == 2 && mabGUI.selectedTransition == null )
                {
                    mabGUI.deselectTransition( );
    
                    ipcRenderer.send( 'changeTransitionDetails-createwindow',
                                    transition.component.name, transition.name );
                }

            } );

        transition.component.useSelectionArea.on( 'click',
            function( event )
            {
                if( event.evt.button == 2 && mabGUI.selectedTransition != null )
                {
                    transition.component.addDependency( mabGUI.selectedTransition );
                }
            } );

    }

    initMovementListeners( )
    {

        let transition = this;
        let remove = transition.remove.bind( transition );

        this.selectShape.on( 'mouseenter',
            function( )
            {
                mabGUI.stage.container( ).style.cursor = 'pointer';
                window.addEventListener( 'keydown', remove );
            } );

        this.selectShape.on( 'mousemove',
            function( )
            {

                let mousePos = mabGUI.stage.getPointerPosition( );
                transition.tooltip.position( { x: mousePos.x + 10, y: mousePos.y + 10 } );
                transition.tooltip.text( transition.component.name + '-' + transition.name );
                transition.tooltip.show( );
                transition.component.tooltipLayer.batchDraw( );

            } );

        this.selectShape.on( 'mouseleave',
            function( )
            {

                mabGUI.stage.container( ).style.cursor = 'default';

                if( mabGUI.selectedTransition != transition )
                {
                    transition.shape.stroke( 'black' );
                    transition.shape.strokeWidth( 1 );

                } else {
                    transition.shape.stroke( 'blue' );
                    transition.shape.strokeWidth( 5 );
                }

                mabGUI.stage.batchDraw( );

            } );

        this.selectShape.on( 'mouseout',
            function( )
            {

                transition.tooltip.hide( );
                transition.component.tooltipLayer.draw( );

                window.removeEventListener( 'keydown', remove );

            } );

        this.source.shape.on( 'dragmove',
            function( )
            {

                transition.shape.setPoints(
                    [ MabGUI.snapCoords( transition.source.shape.getX( ) ),
                      MabGUI.snapCoords( transition.source.shape.getY( ) ),
                      MabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( )) / 2 ) + transition.offset ),
                      MabGUI.snapCoords( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2,
                      MabGUI.snapCoords( transition.destination.shape.getX( ) ),
                      MabGUI.snapCoords( transition.destination.shape.getY( ) )

                ] );

                transition.selectShape.position( {
                    x: MabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( ) ) / 2 ) + transition.offset ),
                    y: MabGUI.snapCoords( ( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2 )
                } );

            } );

        this.destination.shape.on('dragmove',
            function( )
            {

                transition.shape.setPoints(
                    [ MabGUI.snapCoords( transition.source.shape.getX( ) ),
                      MabGUI.snapCoords( transition.source.shape.getY( ) ),
                      MabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( ) ) / 2) + transition.offset ),
                      MabGUI.snapCoords( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2,
                      MabGUI.snapCoords( transition.destination.shape.getX( ) ),
                      MabGUI.snapCoords( transition.destination.shape.getY( ) )

                    ] );

                transition.selectShape.position(
                    { x: MabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( ) ) / 2 ) + transition.offset ),
                      y: MabGUI.snapCoords( ( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2 )
                } );

            } );

        this.component.useSelectionArea.on( 'mouseover',
            function( event )
            {
                if( mabGUI.selectedTransition != null )
                {
                    transition.component.useSelectionArea.fill( 'green' );
                    transition.component.useSelectionArea.opacity( 1 );
                    mabGUI.stage.batchDraw( );
                }
            } );

        this.component.useSelectionArea.on( 'mouseout',
            function( )
            {
                if( transition.component.useSelectionArea.opacity( ) == 1 )
                {
                    transition.component.useSelectionArea.opacity( 0 );
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
            
            if( !confirm( 'Are you sure you want to delete this transition?' ) )
            {
                return;
            }

        }

        mabGUI.selectedTransition = null;
        
        while( this.dependencies.length != 0 )
        {
            // @todo: make this function in dependency.js
            this.dependencies[ 0 ].remove( ); 
        }

        // removing from source place
        let index = this.source.transitions.out.indexOf( this );
        this.source.transitions.out.splice( index, 1 );
        // removing from destination place
        index = this.destination.transitions.in.indexOf( this );
        this.destination.transitions.in.splice( index, 1 );
        // removing from component
        index = this.component.transitions.indexOf( this );
        this.component.transitions.splice( index, 1 );

        this.tooltip.destroy( );
        this.shape.destroy( );
        this.selectShape.destroy( );
        this.group.destroy( );

        let remove = this.remove.bind( this );
        window.removeEventListener( 'keydown', remove );

        mabGUI.stage.batchDraw( );

    }

}
