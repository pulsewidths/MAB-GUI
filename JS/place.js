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

                    if( mabGUI.assembly.selectedPlace == place )
                    {
                        mabGUI.assembly.deselectPlace( );
                        return;
                    }

                    mabGUI.assembly.deselectPlace( );
                    mabGUI.assembly.selectPlace( place );

                }
            } );

    }

    initRightClickListeners( )
    {
        
        let place = this;
        let component = this.component;

        // rmb, no prior selection
        this.shape.on( 'click',
            function( event )
            {

                if( event.evt.button === 2 && mabGUI.assembly.selectedPlace == null )
                {

                    place.shape.stroke( 'blue' );
                    place.shape.strokeWidth( 3 );
                    place.shape.draw( );

                    ipcRenderer.send( 'changePlaceName-createwindow', component.name, place.name );
                    
                }

            } );

            // rmb, prior selection exists
            this.shape.on( 'click',
                function( event )
                {
                    if( event.evt.button === 2 && mabGUI.assembly.selectedPlace != null )
                    {

                        component.addTransition( mabGUI.assembly.selectedPlace, place );

                    }
                } );

    }

    initMovementListeners( )
    {

        let place = this;

        this.shape.on( 'dragend',
            function( event )
            {
                place.shape.position(
                    {
                        x: mabGUI.snapCoords( place.shape.x( ) ),
                        y: mabGUI.snapCoords( place.shape.y( ) )
                    } );
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

                if( mabGUI.assembly.selectedPlace != null )
                {
                    if( place.component.validTransition( mabGUI.assembly.selectedPlace, place ) )
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

                window.addEventListener( 'keydown', place.removePlace );
            } );

        this.shape.on( 'mouseleave',
            function( )
            {
                mabGUI.stage.container( ).style.cursor = 'default';

                if( mabGUI.assembly.selectedPlace != place )
                {
                    place.shape.stroke( 'black' );
                    place.shape.strokeWidth( 1 );
                    mabGUI.layer.batchDraw( );
                } else {
                    mabGUI.assembly.selectPlace( mabGUI.assembly.selectedPlace );
                }
            } );

        this.shape.on( 'mouseout',
            function( )
            {
                place.tooltip.hide( );
                place.component.tooltipLayer.draw( )
                window.removeEventListener( 'keydown', place.removePlace );
            } );

    }

    deletorPrompt( event, place )
    {

        // del = 46
        if( ( event.keyCode === 46 || event.keyCode == 8 ) &&
            confirm( 'Are you sure you want to delete this Place?' ) )
        {
            place.tooltip.destroy();
            mabGUI.assembly.selectedPlace = null;
            deletor( component );
        }

    }

}

// Add new place function, should only be called by component
function addNewPlace( parentComponent, position ) {

    // @todo: move this to dependency.js?
    //
    // event: provide selection area right-click
    component_obj.provide_selection_area.on("click", function(e) {

        if(e.evt.button === 2 && selected_source != null) {

            selected_source.dependency = true;

            var type = ipcRenderer.sendSync("set_dependency_type");

            if(type == 'service') {
                selected_source.dependency_type = 'PROVIDE'
            } else if(type == 'data') {
                selected_source.dependency_type = 'DATA_PROVIDE'
            }

            createDependencyPort(selected_source_comp, selected_source);

            selected_source.place_konva.stroke('black');
            selected_source.place_konva.strokeWidth(1);
            selected_source = null;
            selected_source_comp = null;
            layer.batchDraw();

        }

    });

    // @todo: move this to dependency.js?
    //
    // event: provide selection area mouse over
    component_obj.provide_selection_area.on("mouseover", function() {

        // if source konva has been selected show green provide selection area on mouse enter
        if(selected_source != null) {

            component_obj.provide_selection_area.fill('green');
            component_obj.provide_selection_area.opacity(1);
            layer.batchDraw();

        }

    });

    // @todo: move this to dependency.js?
    //
    // event: provide selection area mouse out
    component_obj.provide_selection_area.on("mouseout", function() {

        // if provide selection area was visible, hide it!
        if(component_obj.provide_selection_area.opacity() === 1) {

            component_obj.provide_selection_area.opacity(0);
            layer.batchDraw();

        }

    });

};

    // @todo: move this to dependency.js?
    //
function createDependencyPort(component_obj, place_obj) {

    var component = component_obj.konva_component;
    var component_group = component_obj.component_group_konva;
    var place = place_obj.place_konva;
    var tooltipLayer = component_obj.tooltipLayer;

    // create dependency here if set true
    if(place_obj.dependency) {

        // determine which type of dependency
        switch(place_obj.dependency_type) {

            case 'PROVIDE':
                // Creating service provide dependency
                dependency_obj = addNewServiceDependency(component, place, place_obj, component_obj, component_group, tooltipLayer);
                place_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
                break;

            case 'DATA_PROVIDE':
                // Creating service provide dependency
                dependency_obj = addNewDataDependency(component, place, place_obj, component_obj, component_group, tooltipLayer);
                place_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
                break;

            case '':
                alert("Dependency type has not been specified");
                break;

            default:
                // invalid dependency type
                alert("Invalid dependency type: " + place_obj.dependency_type);

        }

        return dependency_obj;
    }

};
