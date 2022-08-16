class Dependency {

    constructor( source, serviceData )
    {

        this.type = 'dependency';
        this.name = 'Dependency_' + ( source.component.dependencies.length + 1 );
        this.index = source.component.dependencies.length + 1;

        this.source = source;
        this.serviceData = serviceData; // service or data?

        this.component = source.component;
        this.connections = [];

        this.enabled = false; // @todo: ??

        this.initOffset( );
        this.initKonva( );
        this.initTooltip( );
        this.initListeners( );

        this.source.dependencies.push( this );
        this.component.dependencies.push( this );

    }

    initKonva( )
    {

        if( this.serviceData == 'service' )
        {
            this.initServiceKonva( );
        }
        if( this.serviceData == 'data' )
        {
            this.initDataKonva( );
        }

    }

    initServiceKonva( )
    {

        if( this.source.type == 'transition' ) // use
        {
            // @todo: this naming... eugh
            var anchor = this.source.selectShape
            this.add = -20;
            this.stubX = -15;

        } else if( this.source.type == 'place' ) // provide
        {
            var anchor = this.source.shape;
            this.add = 20;
            this.stubX = 0;
        }

        this.shape = new Konva.Line( {
            points: [ anchor.getX( ),
                      anchor.getY( ),
                    ( this.component.shape.getX( ) + this.offset * this.component.shape.scaleX( ) ),
                      anchor.getY( ) + this.verticalOffset ],
            stroke: 'black', strokeWidth: 1,
            name: 'dependency', tension: 0, dash: [ 10, 5 ], listening: true
        } );

        this.stem = new Konva.Line( {
            points: [ this.component.shape.getX( ) + this.offset * this.component.shape.scaleX( ),
                      anchor.getY( ) + this.verticalOffset,
                    ( this.component.shape.getX( ) + this.offset * this.component.shape.scaleX( ) ) + this.add,
                      anchor.getY( ) + this.verticalOffset ],
            stroke: 'black', strokeWidth: 1,
            name: 'stem', tension: 0
        } );

        this.stub = new Konva.Circle( {
            name: 'stub',
            x: this.shape.points( )[ 2 ] + this.add + this.stubX,
            y: this.shape.points( )[ 3 ],
            ShadowBlur: 1, radius: 8,
            stroke: 'black', strokeWidth: 1, fill: 'black'
        } );

        this.symbol = new Konva.Arc( {
            x: this.stub.getX( ),
            y: this.stub.getY( ),
            innerRadius: 15, outerRadius: 16,
            angle: 180, rotation: 270,
            stroke: 'black', strokeWidth: 1,
        });

        if( this.source.type == 'transition' ) // use
        {
            // showTransitionSelectionArea( this.source ); // @todo: ??
            this.stub.opacity( 0 );
        } else if( this.source.type == 'place' ) // provide
        {
            this.symbol.opacity( 0 );
        }

        this.group = new Konva.Group( {
            name: 'dependencyGroup'
        } );

        this.group.add( this.stub );
        this.group.add( this.symbol );
        this.group.add( this.shape );
        this.group.add( this.stem );
        this.component.group.add( this.group );
        this.group.moveToBottom( );

    }

    initDataKonva( )
    {



    }

    initOffset( )
    {

        if( this.source.type == 'transition' ) // use
        {
            this.offset = 0;
        }
        if( this.source.type == 'place' ) // provide
        {
            this.offset = this.component.shape.getWidth( );
        }

        let verticalOffset;
        let parallelOffset = 0;

        if( this.source.type == 'transition' )
        {
            parallelOffset = this.source.offset * 5;
        }

        switch( this.source.dependencies.length )
        {
            case 0:
                verticalOffset = 0;
                break;
            case 1:
                verticalOffset = 50;
                break;
            case 2:
                verticalOffset = -50;
                break;
        }

        verticalOffset += parallelOffset;

        this.verticalOffset = verticalOffset;

    }

    initTooltip( )
    {

        this.tooltip = new Konva.Text( {
            text: '',
            fontFamily: 'Calibri', fontSize: 12,
            textFill: 'white', fill: 'black',
            padding: 5, alpha: 0.75, visible: false
        } );

        this.component.tooltipLayer.add( this.tooltip );

    }

    initListeners( )
    {
        this.initLeftClickListeners( );
        this.initRightClickListeners( );
        this.initMovementListeners( );
    }

    initLeftClickListeners( )
    {

        let dependency = this;

        this.stub.on( 'click',
            function( event )
            {
                if( event.evt.button == 0 )
                {
                    if( mabGUI.selectedDependency == dependency )
                    {
                        mabGUI.deselectDependency( );
                        return;
                    }
                    mabGUI.deselectDependency( );
                    mabGUI.selectDependency( dependency );
                }
            } );

    }

    initRightClickListeners( )
    {

        let dependency = this;

        this.stub.on( 'click',
        function( event )
        {
            if( event.evt.button == 2 )
            {
                if( !mabGUI.selectedDependency || mabGUI.selectedDependency == dependency )
                {
                    // change dependency details!
                    mabGUI.deselectDependency( );
                }

                mabGUI.assembly.addConnection( mabGUI.selectedDependency, dependency );
                mabGUI.deselectDependency( );

            }
        } );

    }

    initMovementListeners( )
    {

        let dependency = this;
        let remove = this.remove.bind( this );

        if( this.source.type == 'transition' )
        {
            var anchor = this.source.selectShape;
        }
        if( this.source.type == 'place' )
        {
            var anchor = this.source.shape;
        }

        this.stub.on( 'mousemove',
            function( )
            {
                let mousePos = mabGUI.stage.getPointerPosition( );
                dependency.tooltip.position( {
                    x: mousePos.x + 10,
                    y: mousePos.y + 10
                } );
                dependency.tooltip.text( dependency.component.name + ' - ' + dependency.name );
                dependency.tooltip.show( );
                mabGUI.stage.batchDraw( );
            } );

        this.stub.on( 'mouseenter',
            function( )
            {
                window.addEventListener( 'keydown', remove );
            } );

        this.stub.on( 'mouseout',
            function( )
            {
                dependency.tooltip.hide( );
                mabGUI.stage.batchDraw( );
                window.removeEventListener( 'keydown', remove );
            } );

        anchor.on( 'xChange yChange',
            function( )
            {
                dependency.shape.setPoints( [ anchor.getX( ),
                                              anchor.getY( ),
                                              dependency.component.shape.getX( ) + dependency.offset * dependency.component.shape.scaleX( ),
                                              anchor.getY( ) + dependency.verticalOffset ] );
                dependency.stem.setPoints( [ dependency.component.shape.getX( ) + dependency.offset * dependency.component.shape.scaleX( ),
                                             anchor.getY( ) + dependency.verticalOffset,
                                             ( dependency.component.shape.getX( ) + dependency.offset * dependency.component.shape.scaleX( ) ) + dependency.add,
                                             anchor.getY( ) + dependency.verticalOffset ] );
                dependency.stub.position( {
                    x: dependency.shape.points( )[ 2 ] + dependency.add + dependency.stubX,
                    y: dependency.shape.points( )[ 3 ]
                } );
                dependency.symbol.position( {
                    x: dependency.stub.getX( ),
                    y: dependency.stub.getY( )
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

        // ...remove!

    }

}

function hideTransitionSelectionArea(source_obj){
    if(source_obj.type != "Transition"){
        return;
    } else {
        if(source_obj.transition_selection_area.opacity() == 1 && source_obj.dependency_count == 0){
            source_obj.transition_selection_area.opacity(0);
        }
    }
}

// Add new Service dependency function, should only be called by place and transition
function addNewDataDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {
    var offset;
    var add;
    var stub_x;
    var dependency_name;

    var stub;
    var data_stub_provide;
    var data_symbol_provide;
    var data_stub_use;
    var data_symbol_use;

    var verticalOffset;

    // provide connection going right of a place
    if(source_obj.type == 'Place'){
        // create the dependency object
        var dependency_obj = new Dependency('DATA_PROVIDE', "Dependency_" + index);
        component_obj.dependency_list.push(dependency_obj);
        offset = component.getWidth();
        add = 20;
        stub_x = -5;
        dependency_name = dependency_obj.type + " Provide Dependency from " + source_obj.name;
        // set vertical offset for dependency port
        verticalOffset = getVerticalOffset(source_obj);
    } else if (source_obj.type == 'Transition') {
        // create the dependency object
        var dependency_obj = new Dependency('DATA_USE', "Dependency_" + index);
        component_obj.dependency_list.push(dependency_obj);
        // use connection going left of a transition
        offset = 0;
        add = -20;
        stub_x = 0;
        dependency_name = dependency_obj.type + " Use Dependency from " + source_obj.name;
        // set vertical offset for dependency port
        verticalOffset = getVerticalOffset(source_obj);
        // toggle transition selection area opacity
        showTransitionSelectionArea(source_obj);
    };

    // set index
    dependency_obj.index = index;

    // set source obj of dependency stub
    dependency_obj.source_obj = source_obj;
    // add dependency obj to source_obj dep list
    source_obj.dependency_obj_list.push(dependency_obj);

    // increment source obj dependency count
    source_obj.dependency_count++;

    dependency_obj.component_obj = component_obj;

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() + offset * component.scaleX()), source_element.getY() + verticalOffset],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stem = new Konva.Line({
        points: [component.getX() + offset * component.scaleX(), source_element.getY() + verticalOffset, (component.getX() + offset * component.scaleX()) + add, source_element.getY() + verticalOffset],
        stroke: 'black',
        strokeWidth: 1,
        name: 'stem',
        tension: 0,
    });

    // create a new dependency_group
    var dependency_group = new Konva.Group({
        name: 'dependency_group'
    });

    // add dependency (dashed line) and stem to dependency group
    dependency_group.add(dependency);
    dependency_group.add(stem);

    // stub for provide dependency
    if(source_obj.type == 'Place'){
        // Data type
        // make invisible circle for hover
        stub = getDataStubHover();
        data_stub_provide = getDataStubProvide();
        // symbol is invisbile until connection has been established
        data_symbol_provide = getDataSymbolProvide();
        data_symbol_provide.opacity(0);
        dependency_obj.dep_symbol_konva = data_symbol_provide;
        dependency_obj.dep_stub_konva = stub;
        // add all to dependency group
        dependency_group.add(stub);
        dependency_group.add(data_stub_provide);
        dependency_group.add(data_symbol_provide);

    }
    else if(source_obj.type == 'Transition') {
        // invisible stub for selection
        stub = getDataStubHover();
        data_stub_use = getDataStubUse();
        data_stub_use.opacity(0);
        data_symbol_use = getDataSymbolUse();
        dependency_obj.dep_symbol_konva = data_symbol_use;
        dependency_obj.dep_stub_konva = stub;
        dependency_obj.dep_stub_use_konva = data_stub_use;
        // add all to dependency group
        dependency_group.add(stub);
        dependency_group.add(data_stub_use);
        dependency_group.add(data_symbol_use);
    };

    function getDataStubHover(){
        var stub = new Konva.Circle({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3],
            radius: 8,
            stroke: 'black',
            strokeWidth: 1,
            name: 'stub',
            ShadowBlur: 1,
            opacity: 0
        });
        return stub;
    }

    function getDataStubProvide(){
        var stub = new Konva.Line({
            points: [(dependency.points()[2] + add) - 5, dependency.points()[3] + 5,
                     (dependency.points()[2] + add), dependency.points()[3],
                     (dependency.points()[2] + add) - 5, dependency.points()[3] - 5],
            stroke: 'black',
            strokeWidth: 2,
            name: 'stub',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0,
            opacity: 1
        });
        return stub;
    }

    function getDataStubUse(){
        var DataStubUse = new Konva.Line({
            points: [(dependency.points()[2] + add) - 15, dependency.points()[3] + 5,
                     (dependency.points()[2] + add) - 10, dependency.points()[3],
                     (dependency.points()[2] + add) - 15, dependency.points()[3] - 5],
            stroke: 'black',
            strokeWidth: 1,
            name: 'stub',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0,
            opacity: 1
        });
        return DataStubUse;
    }

    function getDataSymbolProvide(){
        var DataSymbolProvide = new Konva.Line({
            points: [(dependency.points()[2] + add), dependency.points()[3] + 10,
                     (dependency.points()[2] + add) + 10, dependency.points()[3],
                     (dependency.points()[2] + add), dependency.points()[3] - 10],
            stroke: 'black',
            strokeWidth: 1,
            name: 'DataSymbolProvide',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0
        });
        return DataSymbolProvide;
    }

    function getDataSymbolUse(){
        var DataSymbolUse = new Konva.Line({
            points: [(dependency.points()[2] + add) - 10, dependency.points()[3] + 10,
                     (dependency.points()[2] + add), dependency.points()[3],
                     (dependency.points()[2] + add) - 10, dependency.points()[3] - 10],
            stroke: 'black',
            strokeWidth: 2,
            name: 'DataSymbolUse',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0
        });
        return DataSymbolUse;
    }

    // tooltip to display name of object
    var tooltip = new Konva.Text({
        text: "",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 5,
        textFill: "white",
        fill: "black",
        alpha: 0.75,
        visible: false
    });

    tooltipLayer.add(tooltip);
    stage.add(tooltipLayer);

    // if mouse is over a stub
    stub.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name + " - " + dependency_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    stub.on('mouseenter', function () {
        window.addEventListener('keydown', removeStub);
    });

    // hide the tooltip on mouse out
    stub.on('mouseout', function(){
        tooltip.hide();
        tooltipLayer.draw();
        window.removeEventListener('keydown', removeStub);
    });

    function removeStub(ev){
        // keyCode Delete key = 46
        if (ev.keyCode === 46 || ev.keyCode == 8) {
            if (confirm('Are you sure you want to delete this dependency?')){
                // Delete it!
                //dependency_group.destroy();
                tooltip.destroy();

                // remove connection if created from dependency stub

                // set source_obj dependency boolean to false
                source_obj.dependency = false;

                // remove the depedency obj from its components dependency list
                //removeDependencyObj(component_obj, dependency_obj);
                deletor(dependency_obj);
            } else {
                // Do nothing!
                return;
            }
        }
    };

    // when the source element moves
    source_element.on('xChange yChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY() + verticalOffset]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY() + verticalOffset,
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY() + verticalOffset]);

        // invisible stub for selection
        stub.position({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3]
        });
        if(data_stub_provide != null){
            // update the provide points
            data_stub_provide.setPoints([(dependency.points()[2] + add) - 5, dependency.points()[3] + 5,
                                         (dependency.points()[2] + add), dependency.points()[3],
                                         (dependency.points()[2] + add) - 5, dependency.points()[3] - 5]);
            data_symbol_provide.setPoints([(dependency.points()[2] + add), dependency.points()[3] + 10,
                                          (dependency.points()[2] + add) + 10, dependency.points()[3],
                                          (dependency.points()[2] + add), dependency.points()[3] - 10]);
        }
        if(data_stub_use != null){
            // update the use points
            data_stub_use.setPoints([(dependency.points()[2] + add) - 15, dependency.points()[3] + 5,
                                     (dependency.points()[2] + add) - 10, dependency.points()[3],
                                     (dependency.points()[2] + add) - 15, dependency.points()[3] - 5]);
            data_symbol_use.setPoints([(dependency.points()[2] + add) - 10, dependency.points()[3] + 10,
                                       (dependency.points()[2] + add), dependency.points()[3],
                                       (dependency.points()[2] + add) - 10, dependency.points()[3] - 10]);
        }
        //layer.draw();
    });

     // when the source element moves
     component.on('xChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY() + verticalOffset]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY() + verticalOffset,
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY() + verticalOffset]);

        stub.position({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3]
        });
        if(data_stub_provide != null){
            // update the provide points
            data_stub_provide.setPoints([(dependency.points()[2] + add) - 5, dependency.points()[3] + 5,
                                         (dependency.points()[2] + add), dependency.points()[3],
                                         (dependency.points()[2] + add) - 5, dependency.points()[3] - 5]);
            data_symbol_provide.setPoints([(dependency.points()[2] + add), dependency.points()[3] + 10,
                                           (dependency.points()[2] + add) + 10, dependency.points()[3],
                                           (dependency.points()[2] + add), dependency.points()[3] - 10]);
        }
        if(data_stub_use != null){
            // update the use points
            data_stub_use.setPoints([(dependency.points()[2] + add) - 15, dependency.points()[3] + 5,
                                     (dependency.points()[2] + add) - 10, dependency.points()[3],
                                     (dependency.points()[2] + add) - 15, dependency.points()[3] - 5]);
            data_symbol_use.setPoints([(dependency.points()[2] + add) - 10, dependency.points()[3] + 10,
                                       (dependency.points()[2] + add), dependency.points()[3],
                                       (dependency.points()[2] + add) - 10, dependency.points()[3] - 10]);
        }
    });

    // if a click over stub
    stub.on("click", function(e){
        if (e.evt.button === 0){
            // first left click
            console.log("Left clicked stub: ", source_obj.name);
            // check if source stub is a provide dependency
            if(source_obj.type == 'Place'){
                provide_component_obj = component_obj;
                provide_source_obj = source_obj;
                provide_stub_konva = stub;
                provide_component_group = component_group;
                provide_symbol = data_symbol_provide;
                provide_dependency_type = source_obj.dependency_type;
                provide_dependency_obj = dependency_obj;
                // set pointer to dependency obj stub/symbol
                provide_dependency_obj.dep_stub_konva = provide_symbol;
                console.log("PROVIDE dependency type is " + provide_dependency_type);
                // set source selected true
                source_selected = true;
            }
        }
        else if (e.evt.button === 2){
            console.log("Right clicked stub: ", source_obj.name);
            // check if provide stub was selected prior to create connection
            if(source_selected == true){
                // check if connection is going to USE stub
                if(source_obj.type == 'Transition'){
                    // get the use stub dependency type
                    use_dependency_type = source_obj.dependency_type;
                    console.log("USE dependency type is " + use_dependency_type);
                    // check if source stub and dest stub is the same dependency type
                    if((provide_dependency_type == 'PROVIDE' && use_dependency_type == 'USE') || (provide_dependency_type == 'DATA_PROVIDE' && use_dependency_type == 'DATA_USE')){
                        use_component_obj = component_obj;
                        // check if provide stub component is different from use stub component
                        if(provide_component_obj != use_component_obj){
                            use_source_obj = source_obj;
                            use_stub_konva = stub;
                            use_component_group = component_group;
                            use_dependency_obj = dependency_obj;
                            // set pointer to dependency obj stub/symbol
                            use_dependency_obj.dep_stub_konva = data_stub_use;
                            // check if connection already exists between these two depedencies
                            if(!checkConnectionExist(provide_dependency_obj, use_dependency_obj)){
                                //provide_symbol.opacity(1);
                                provide_dependency_obj.dep_stub_konva.opacity(1);
                                use_dependency_obj.dep_stub_konva.opacity(1);
                                // check if arc is visible
                                // if(provide_symbol.opacity() == 0){
                                //     // make things visible
                                //     provide_symbol.opacity(1);
                                //     data_stub_use.opacity(1);
                                // }
                                // create new connection here
                                connection_obj = addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group, provide_dependency_obj, use_dependency_obj);
                            } else {
                                alert("Connection already exists between these two dependencies");
                            }
                        } else {
                            alert("Cant create connection from " + provide_component_obj.name + " to " + use_component_obj.name);
                        }
                    } else {
                        alert("Incompatible dependency types");
                    }
                } else {
                    alert("Left click Provide dependency stub and Right click Use dependency stub to connect them");
                }
            } else {
                // right clk source was not selected, open window for editing
                console.log("Open window for editing " + source_obj.name + " dependency stub details");
                ipcRenderer.send("change_stub_details", {component: component_obj.name, stub: dependency_obj.name});
            }
            // reset source and dest
            provide_stub_konva = null;
            use_stub_konva = null;
            source_selected = false;
        }
    });

    // add dependency group to dependency obj
    dependency_obj.dep_group_konva = dependency_group;
    // add dependency group to component group
    component_group.add(dependency_group);
    // move dependency group to bottom
    dependency_group.moveToBottom();
    layer.draw();

    return dependency_obj;
}

// func to check if connection already exists in connection list
function checkConnectionExist(provide_dependency_obj, use_dependency_obj){
    for (var i = 0; i < connection_list.length; i++){
        if((connection_list[i].provide_port_obj == provide_dependency_obj && connection_list[i].use_port_obj == use_dependency_obj) ||  
           (connection_list[i].provide_port_obj.source_obj == provide_dependency_obj.source_obj && connection_list[i].use_port_obj.source_obj == use_dependency_obj.source_obj)){
            return true;
        }
    }
    return false;
}
// Catch new stub name from ipcMain
ipcRenderer.on("stub->renderer", function(event, args) {
    changeStubName(args.component, args.old_name, args.new_name);
});
