class Component
{

    constructor( name, parentAssembly, pos ) // @todo: is type required...?
    {

        this.type = 'component';
        this.name = name;
        this.index = parentAssembly.componentList.length;

        this.assembly = parentAssembly;
        this.placeList = [ ];
        this.transitionList = [ ];
        this.transitionDictionary = { };
        this.dependencyList = [ ];

        this.tooltipLayer = null;
        this.tooltip = null;

        this.initKonva( pos.x, pos.y );
        this.initTooltip( );
        this.initListeners( );

    }

    initKonva( posX, posY )
    {

        this.group = new Konva.Group( {
            x: posX, y: posY,
            width: 300, height: 350,
            draggable: true, name: 'componentGroup'
        } );
        this.shape = new Konva.Rect( {
            x: 0, y: 0,
            width: 300, height: 350,
            stroke: 'black', name: 'component',
            strokeWidth: 0.5
        } );

        this.useSelectionArea = new Konva.Rect( {
            x: 0, y: 0,
            width: 15, height: 350,
            opacity: 0, name: 'useSelectionArea'
        } );
        this.provideSelectionArea = new Konva.Rect( {
            x: this.shape.getWidth( ) - 15, y: 0,
            width: 15, height: 350,
            opacity: 0, name: 'provideSelectionArea'
        } );

        this.group.add( this.shape );
        this.group.add( this.useSelectionArea );
        this.group.add( this.provideSelectionArea );

        mabGUI.layer.add( this.group );
        mabGUI.layer.draw( );

    }

    initTooltip( )
    {

        this.tooltip = new Konva.Text( {
            text: '', fontFamily: 'Calibri', fontsize: 12,
            padding: 5, textFill: 'white', fill: 'black',
            alpha: 0.75, visible: false
        } );
        this.tooltipLayer = new Konva.Layer( );
        this.tooltipLayer.add( this.tooltip );
        mabGUI.stage.add( this.tooltipLayer );

    }

    initListeners( )
    {

        this.initLeftClickListeners( ); // single & double.
        this.initRightClickListeners( );
        this.initMovementListeners( );

    }

    initLeftClickListeners( )
    {
        
        // single-click on stage.
        // @todo: should this be somewhere else...?
        mabGUI.stage.on( 'click',
            function( event )
            {
                if( event.evt.button === 0 )
                {
                    // if clicking on empty area...
                    if( event.target === mabGUI.stage )
                    {
                        mabGUI.stage.find( 'Transformer' ).destroy( ); // deselect
                        mabGUI.layer.draw( );
                        return;
                    }

                    // if clicking on a component...
                    if( event.target.hasName( 'component' ) )
                    {

                        // remove any current selection
                        mabGUI.stage.find( 'Transformer' ).destroy( );

                        var transformer = new Konva.Transformer( {
                            rotateEnabled: false,
                            enabledAnchors: [ 'middle-right', 'bottom-center', 'bottom-right' ]
                        } );

                        event.target.getParent( ).add( transformer );
                        transformer.attachTo( event.target );
                        mabGUI.layer.draw( );
                        
                    }

                }
            }
        );

        // weirdness from js's anonymous scoping
        var component = this;

        // double-click in component.
        this.shape.on( 'dblclick',
            function( event )
            {

                if( event.evt.button === 0 )
                {

                    var transform = component.shape.getParent( ).getAbsoluteTransform( ).copy( );
                    // get relative position
                    transform.invert( );
                    var pos = mabGUI.stage.getPointerPosition( );
                    var placePos = transform.point( pos );
                    var placeObj = addNewPlace( this, placePos ); // @todo: global function?

                    // turn last line into constructor?
                    // var placeObj = new Place( this, placePos );

                    mabGUI.layer.draw( );

                }
            } );

    }

    initRightClickListeners( )
    {

        var component = this;

        // when this component is right-clicked...
        this.shape.on( 'click',
            function( event )
            {
                if( event.evt.button === 2 ) // rmb.
                {

                    console.log( 'asdf' );

                    // highlight
                    component.shape.stroke( 'blue' );
                    component.shape.strokeWidth( 3 );
                    component.shape.draw( );

                    // prompt for name change.
                    ipcRend.send( 'updateComponent', this );

                }
            }
        );

    }

    initMovementListeners( )
    {

        var component = this;

        this.shape.on( 'xChange yChange',
            function( )
            {
                component.useSelectionArea.position(
                    { x: component.shape.getX( ),
                      y: component.shape.getY( ) } );
                component.useSelectionArea.height( component.shape.getHeight( ) * component.shape.scaleY( ) );
                
                component.provideSelectionArea.position(
                    { x: component.shape.getX( ) + ( component.shape.getWidth( ) * component.shape.scaleX( ) ) - 15,
                      y: component.shape.getY( ) } );
                      component.provideSelectionArea.height( component.shape.getHeight( ) * component.shape.scaleY( ) );
            } );

        this.group.on( 'dragmove',
            function( )
            {
                component.tooltip.hide( );
                component.tooltipLayer.draw( );
            } );

        this.group.on( 'dragend',
            function( )
            {
                component.group.position( {
                    x: snapToGrid( component.group.x( ) ),
                    y: snapToGrid( component.group.y( ) )
                } )
                mabGUI.layer.batchDraw( );
            } );
        
        this.shape.on( 'mousemove',
            function( )
            {
                var mousePos = mabGUI.stage.getPointerPosition( );
                component.tooltip.position( { x: mousePos.x + 10, y: mousePos.y + 10 } );
                component.tooltip.text( component.name );
                component.tooltip.show( );
                component.tooltipLayer.batchDraw( );
            } );

        this.shape.on( 'mouseover',
            function( )
            {
                window.addEventListener( 'keydown', component.deletorPrompt );
            } );

        this.shape.on( 'mouseout',
            function( )
            {
                component.shape.stroke( 'black' );
                component.shape.strokeWidth( 1 );
                component.tooltip.hide( );
                component.tooltipLayer.draw( );
                window.removeEventListener( 'keydown', component.deletorPrompt );
            } );

    }

    deletorPrompt( event )
    {

        if( event.keyCode === 46 || event.keyCode === 8 )
        {
            if( confirm( 'Deleting this component will remove everything inside of it - are you sure?' ) )
            {
                deletor( this );
            }
        }

    }

}

module.export = Component;