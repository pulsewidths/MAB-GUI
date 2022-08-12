class Component
{

    constructor( name, pos )
    {

        this.type = 'component';
        this.name = name;
        this.index = mabGUI.assembly.componentList.length;

        this.places = [ ];
        this.transitions = [ ];
        this.dependencies = [ ];

        this.initKonva( pos );
        this.initTooltip( );
        this.initListeners( );

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
                    if ( event.target.hasName( 'component' ) )
                    {
                        // remove any current selection
                        mabGUI.stage.find( 'Transformer' ).destroy( );
                        var transformer = new Konva.Transformer(
                            { rotateEnabled: false,
                              enabledAnchors: ['middle-right', 'bottom-center', 'bottom-right'] }
                        );
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
                      y: component.shape.getY( ) }
                );
                component.useSelectionArea.height( component.shape.getHeight( ) * component.shape.scaleY( ) );

                component.provideSelectionArea.position(
                    { x: component.shape.getX() + ( component.shape.getWidth( ) * component.shape.scaleX( ) ) - 15,
                      y: component.shape.getY() }
                    );
                component.provideSelectionArea.height( component.shape.getHeight( ) * component.shape.scaleY( ) );
            });

        this.group.on( 'dragmove',
            function( )
            {
                component.tooltip.hide( );
                component.tooltipLayer.draw( );
            } );

        this.group.on( 'dragend',
            function( )
            {
                component.group.position(
                    { x: mabGUI.snapCoords( component.group.x( ) ),
                      y: mabGUI.snapCoords( component.group.y( ) ) }
                );
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
            });

    }

    findPlace( placeName )
    {
        for( let index = 0; index < this.places.length; index++ )
        {
            if( this.places[ index ].name == placeName )
            {
                return this.places[ index ];
            }
        }
    }

    addPlace( pos )
    {

        let name = 'Place_' + (this.places.length + 1 );
        let place = new Place( name, this, pos );
        this.places.push( place );
        mabGUI.layer.draw( );

    }

    addTransition( source, destination )
    {

        const MAX_TRANSITIONS = 3;

        if( this.validTransition( source, destination ) )
        {

            let name = 'Transition_' + this.transitions.length;
            let func = 'defaultFunction' + this.transitions.length;

            let transition = new Transition( name, source, destination, func );

            this.transitions.push( transition );
            source.transitions.out.push( transition );
            destination.transitions.in.push( transition );

            mabGUI.layer.draw( );

        } else {
            alert('Can\'t create more than ' + MAX_TRANSITIONS + ' transitions.');
        }

        mabGUI.stage.container( ).style.cursor = 'default';
        mabGUI.assembly.deselectPlace( );
    }

    // @todo: should this possibly be in Assembly?
    validTransition( source, destination )
    {

        let name = 'Transition_' + this.transitions.length;
        let func = 'defaultFunction' + this.transitions.length;

        let transition = new Transition( name, source, destination, func );

        this.transitions.push( transition );
        source.transitions.out.push( transition );
        destination.transitions.in.push(transition );

        const MAX_TRANSITIONS = 3;

        if ( source.transitions.out.length > MAX_TRANSITIONS ||
            destination.transitions.in.length > MAX_TRANSITIONS )
        {
            this.transitions.pop( );
            source.transitions.out.pop( );
            destination.transitions.in.pop( );
            return false;
        }

        if ( source.component != destination.component || source == destination )
        {
            this.transitions.pop( );
            source.transitions.out.pop( );
            destination.transitions.in.pop( );
            return false;
        }
        if (source.component.transitions.length == 0 )
        {
            this.transitions.pop( );
            source.transitions.out.pop( );
            destination.transitions.in.pop( );
            return true;
        }

        let roots = source.component.getRoots( );

        for( let rootIndex = 0; rootIndex < roots.length; rootIndex++ )
        {
            let root = roots[ rootIndex ];

            console.log( roots );

            let valid = !this.isCyclic( root );

            if( !valid )
            {
                this.transitions.pop( );
                source.transitions.out.pop( );
                destination.transitions.in.pop( );
                return false;
            }

        }

        this.transitions.pop( );
        source.transitions.out.pop( );
        destination.transitions.in.pop( );

        return true;

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
            let cyclic = this.isCyclic( place.transitions.out[ transitionIndex ].destination, visited );
            visited.pop( );
            if( cyclic ) { return true; }
        }

        return false;

    }

    getRoots( )
    {

        let roots = [ ];

        for( let placeIndex = 0; placeIndex < this.places.length; placeIndex++ )
        {

            if( this.places[ placeIndex ].transitions.in.length == 0 )
            {
                roots.push( this.places[ placeIndex ] );
            } else {
                return roots;
            }

        }

    }

    deletorPrompt( event, component )
    {

        if( ( event.keyCode === 46 || event.keyCode === 8 ) &&
              confirm( 'Deleting this component will remove everything inside of it - are you sure?' ) );
        {
            component.tooltip.destroy( );
            deletor( this );
        }

    }

}

module.export = Component;