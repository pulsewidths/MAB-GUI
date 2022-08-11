class Component
{

    constructor( name, parentAssembly, pos )
    {

        this.type = 'component';
        this.name = name;
        this.index = parentAssembly.componentList.length;

        this.assembly = parentAssembly;
        this.placeList = [ ];
        this.transitions = [ ];
        this.dependencyList = [ ];

        this.initKonva( pos );
        this.initTooltip( );
        this.initListeners( );

    }

    addPlace( pos )
    {

        let name = 'Place_' + ( this.placeList.length + 1 );
        let place = new Place( name, this, pos );

        this.placeList.push( place );

    }
    
    getPlace( placeName )
    {
        for( let index = 0; index < this.placeList.length; index++ )
        {
            if( this.placeList[ index ].name == placeName )
            {
                return this.placeList[ index ];
            }
        }
    }

    addTransition( srcPlace, destPlace )
    {
        if( this.validTransition( srcPlace, destPlace ) )
        {
            let transition = new Transition( 'TransitionX', srcPlace, destPlace, 'defaultFunctionX' );

            this.transitions.push( transition );
        }

        mabGUI.stage.container( ).style.cursor = 'default';
        this.assembly.deselectPlace( );
    }

    validTransition( srcPlace, destPlace )
    {

        let MAX_TRANSITIONS = 3;

        if( srcPlace.transitions.out.length > MAX_TRANSITIONS ||
            destPlace.transitions.in.length > MAX_TRANSITIONS )
            {
                alert( 'Can\'t create more than ' + MAX_TRANSITIONS + ' transitions.' );
                return false;
            }

        if( srcPlace.component != destPlace.component || srcPlace == destPlace )
        {
            return false;
        }
        if( srcPlace.component.transitions.length == 0 )
        {
            return true;
        }

        let roots = srcPlace.component.getRoots( );

        for( let rootIndex = 0; rootIndex < roots.length; rootIndex++ )
        {
            let root = roots[ rootIndex ];

            let transition = new Transition( 'TransitionX', srcPlace, destPlace, 'defaultFunctionX' );

            let valid = !this.isCyclic( );

            // @todo: wrap the following in their own function in Transition ?
            srcPlace.transitions.out.pop( );
            destPlace.transitions.in.pop( );
            // transition.delete( );

            return valid;
        }

    }

    // dfs for cycle
    isCyclic( place, visited=[ ] )
    {

        // check for current place in visited list.
        for( let index = 0; index < visited.length; index++ )
        {
            if( visited[ index ] == place )
            {
                return true;
            }
        }

        // place is now visited
        visited.push( place );

        // recurse for each transition out.
        for( let transitionIndex = 0; transitionIndex < place.transitions.out.length; transitionIndex++ )
        {
            let cyclic = this.isCyclic( place.transitions.out[ transitionIndex ].dest, visited );
            visited.pop( );
            if( cyclic ) { return true; }
        }

        return false;

    }

    initKonva( pos )
    {

        this.group = new Konva.Group( {
            x: pos.x, y: pos.y,
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

        this.tooltipLayer = new Konva.Layer( );

        this.tooltip = new Konva.Text( {
            text: '', fontFamily: 'Calibri', fontsize: 12,
            padding: 5, textFill: 'white', fill: 'black',
            alpha: 0.75, visible: false
        } );
        
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

                    component.addPlace( placePos );

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

                    component.shape.stroke( 'blue' );
                    component.shape.strokeWidth( 3 );
                    component.shape.draw( );

                    // send signal to driver.js, with name of component to be changed
                    ipcRenderer.send( 'changeComponentName-createwindow', component.name );

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
                    x: mabGUI.snapCoords( component.group.x( ) ),
                    y: mabGUI.snapCoords( component.group.y( ) )
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

    getRoots( )
    {

        let roots = [ ];

        for( let placeIndex = 0; placeIndex < this.placeList.length; placeIndex++ )
        {

            if( this.placeList[ placeIndex ].in != null )
            {
                roots.push( this.placeList[ placeIndex ] );
            } else {
                return roots;
            }

        }

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