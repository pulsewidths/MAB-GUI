class Transition
{
    constructor( name, source, destination, func )
    {

        this.type = 'transition';
        this.name = name;
        this.index = source.component.transitions.length;

        this.source = source;
        this.destination = destination;
        this.function = func;

        this.component = source.component;
        this.dependencies = [ ]; // 3 max

        this.current_duration = 0;
        this.duration_min = 1;
        this.duration_max = 2;

        this.component.transitions.push( this );    
        this.source.transitions.out.push( this );
        this.destination.transitions.in.push( this );

        this.initOffset( );

        this.initKonva( );
        this.initTooltip( );
        this.initListeners( );

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
            name: 'Transition', text: this.name,
            stroke: 'black', fill: 'white',
            radius: 10, opacity: 0, fill: 'white'
        } );

        this.source.shape.moveToTop( );
        this.destination.shape.moveToTop( );

        this.group.add( this.shape );
        this.group.add( this.selectShape );
        this.component.group.add( this.group );

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

        this.initLeftClickListeners();
        this.initRightClickListeners();
        this.initMovementListeners();

    }

    initLeftClickListeners( )
    {

        let transition = this;

        this.selectShape.on( 'click',
            function( event )
            {

                if( event.evt.button === 0 )
                {
                    transition.shape.stroke( 'blue' );
                    transition.shape.strokeWidth( 3 );
                    transition.shape.draw( );
                    mabGUI.selectedTransition = transition;
                }

            } );

    }

    initRightClickListeners( )
    {

        let transition = this;

        this.selectShape.on( 'click',
            function( event )
            {

                transition.shape.stroke( 'blue' );
                transition.shape.strokeWidth( 3 );
                transition.shape.draw( );

                ipcRenderer.send( 'change_transition_details',
                                { component: transition.component.name,
                                  transition: transition,
                                  function: transition.func } );

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

        this.selectShape.on( 'mouseout',
            function( )
            {

                mabGUI.stage.container( ).style.cursor = 'default';
                transition.shape.stroke( 'black' );
                transition.shape.strokeWidth( 1 );
                transition.tooltip.hide( );
                transition.component.tooltipLayer.draw( );
                window.removeEventListener( 'keydown', remove );

            } );

        this.source.shape.on( 'dragmove',
            function( )
            {

                transition.shape.setPoints(
                    [ mabGUI.snapCoords( transition.source.shape.getX( ) ),
                      mabGUI.snapCoords( transition.source.shape.getY( ) ),
                      mabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( )) / 2 ) + transition.offset ),
                      mabGUI.snapCoords( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2,
                      mabGUI.snapCoords( transition.destination.shape.getX( ) ),
                      mabGUI.snapCoords( transition.destination.shape.getY( ) )

                ] );

                transition.selectShape.position( {
                    x: mabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( ) ) / 2 ) + transition.offset ),
                    y: mabGUI.snapCoords( ( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2 )
                } );

            } );

        this.destination.shape.on('dragmove',
            function( )
            {

                transition.shape.setPoints(
                    [ mabGUI.snapCoords( transition.source.shape.getX( ) ),
                      mabGUI.snapCoords( transition.source.shape.getY( ) ),
                      mabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( ) ) / 2) + transition.offset ),
                      mabGUI.snapCoords( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2,
                      mabGUI.snapCoords( transition.destination.shape.getX( ) ),
                      mabGUI.snapCoords( transition.destination.shape.getY( ) )

                    ] );

                transition.selectShape.position(
                    { x: mabGUI.snapCoords( ( ( transition.source.shape.getX( ) + transition.destination.shape.getX( ) ) / 2 ) + transition.offset ),
                      y: mabGUI.snapCoords( ( transition.source.shape.getY( ) + transition.destination.shape.getY( ) ) / 2 )
                } );

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
            
            if( !confirm( 'Are you sure you want to delete this Transition?' ) )
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

/*
// function that adds new transition obj and konva arrow
function addNewTransition(component_obj, source_obj, dest_obj) {

    // @todo: move this to dependency.js?
    // 
    // event: right click on use_selection_area
    component_obj.use_selection_area.on("click", function(e){

        if (e.evt.button === 2 && mabGUI.selectedTransition != null) {

            mabGUI.selectedTransition.dependency = true;

            var type = ipcRenderer.sendSync("set_dependency_type");

            if(type == 'service') {
                mabGUI.selectedTransition.dependency_type = 'USE'
            } else if (type == 'data') {
                mabGUI.selectedTransition.dependency_type = 'DATA_USE'
            }

            createDependencyUsePort(component_obj, mabGUI.selectedTransition);

            // reset the source obj and konva pointers to null
            mabGUI.selectedTransition = null;

        }

    });

    // @todo: move this to dependency.js?
    //
    // event: mouse goes over use_selection_area
    component_obj.use_selection_area.on("mouseover", function() {

        // if source konva has been selected show green provide selection area on mouse enter
        if(selected_transition != null){
            component_obj.use_selection_area.fill('green');
            component_obj.use_selection_area.opacity(1);
            layer.batchDraw();
        }

    });


    // @todo: move this to dependency.js?
    //
    // event: mouse leaves use_selection_area
    component_obj.use_selection_area.on("mouseout", function() {

        // if use_selection_area was visible, hide it!
        if(component_obj.use_selection_area.opacity() === 1){
            component_obj.use_selection_area.opacity(0);
            layer.batchDraw();
        }

    });

    }
} */

// @todo: move this to dependency.js?
//
// function to create a use port out of a transition
function createDependencyUsePort(component_obj, transition_obj){

    var component = component_obj.konva_component;
    var component_group = component_obj.component_group_konva;
    var transition_selection_area = transition_obj.transition_selection_area;
    var tooltipLayer = component_obj.tooltipLayer;

    if(!transition_obj.dependency) {
        return;
    }

    // determine which type of dependency
    switch(transition_obj.dependency_type) {

        // create service-use dep
        case 'USE':
            dependency_obj = addNewServiceDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
            transition_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
            break;

        // create data-use dep
        case 'DATA_USE':
            dependency_obj = addNewDataDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
            transition_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
            break;

        // invalid dep type
        default:
            alert("Invalid dependency type: " + transition_obj.dependency_type);

        }

    return dependency_obj;

};

// Catch new transition details from ipcMain
ipcRenderer.on("transition->renderer", function(event, args) {

    if (args.new_func != '') {
        changeTransitionFunc(args.component, args.old_func, args.new_func);
    }

    if (args.duration_min != '') {
        changeTransitionDurationMin(args.component, args.transition, args.new_duration_min);
    }

    if (args.duration_max != '') {
        changeTransitionDurationMax(args.component, args.transition, args.new_duration_max);
    }

    if (args.name != '') {
        changeTransitionName(args.component, args.transition, args.name);
    }

});
