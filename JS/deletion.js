/*
 * This is the ***DELETOR***
 * All objects that need to be deleted, go through him.
 * Before an obj is deleted. The deletor will remove all dependent obj's first. 
 * i.e., 
 *  - dependency port attached to a place or transition marked for deletion
 *  - inbound and outbound transitions attached to a place marked for deletion
 * 
 */
function deletor(deletion_obj){

    // determine the type of deletion obj
    switch(deletion_obj.type){
        case 'PROVIDE':
        case 'USE':
        case 'DATA_PROVIDE':
        case 'DATA_USE':
            // all dependency obj's
            dependencyDeletionHandler(deletion_obj);
            break;

        default:
            console.log("Object to be deleted has unknown type: " + deletion_obj.type);
    }

};

// Handles deletion of Dependency Obj
function dependencyDeletionHandler(dependency_obj){
    //removeDependencyObj(dependency_obj);
    removeConnectionObjConnectedToDependency(dependency_obj);
    removeDependencyObjFromComponentDependencyList(dependency_obj);
    decrementSourceObjDependencyCount(dependency_obj.source_obj);
    removeDependencyGroupKonva(dependency_obj);
    // if the dependency is coming out of a transition
    if(dependency_obj.source_obj.type == "Transition"){ hideTransitionSelectionArea(dependency_obj.source_obj); }
};

// Handles deletion of Connection obj
function connectionDeletionHandler(connection_obj){
    console.log("removing connection attached from PROVIDE port " + connection_obj.provide_port_obj.name + " and USE port " + connection_obj.use_port_obj.name);
    hideDependencyStub(connection_obj);
    // removes connection from both PROVIDE and USE dependencies
    removeConnectionObjFromDependencyConnectionList(connection_obj);
    // removes connection obj from global connection list
    removeConnectionObjFromConnectionList(connection_obj);
    removeConnectionKonva(connection_obj);
};

function removeConnectionObjConnectedToDependency(dependency_obj){
    for (var i = 0; i < dependency_obj.connection_list.length; i++) {
        connectionDeletionHandler(dependency_obj.connection_list[i]);
        i--;
    }
}

// destroys the konva group associated with this obj
function removeDependencyGroupKonva(dependency_obj){
    dependency_obj.dep_group_konva.destroy();
};

function removeDependencyObjFromComponentDependencyList(dependency_obj){
    dependency_obj.component_obj.dependency_list.splice( dependency_obj.component_obj.dependency_list.indexOf(dependency_obj), 1 );
};

// Called when a dependency removed from a place/transition
// source_obj can be either place or transition
function decrementSourceObjDependencyCount(source_obj){
    source_obj.dependency_count--;
};

function removeConnectionObjFromConnectionList(connection_obj){
    // remove connection from connection list
    connection_list.splice( connection_list.indexOf(connection_obj), 1 );
};

// hides both dependency ports that this connection obj is attached to
function hideDependencyStub(connection_obj){
    // if this is the only connection on this dependency port, hide the dependency stub
    if(connection_obj.provide_port_obj.connection_list.length <= 1){
        connection_obj.provide_port_obj.dep_stub_konva.opacity(0);
    }
    if(connection_obj.use_port_obj.connection_list.length <= 1){
        connection_obj.use_port_obj.dep_stub_konva.opacity(0);
    }
};

function removeConnectionObjFromDependencyConnectionList(connection_obj){
    for( var i = 0; i < connection_obj.use_port_obj.connection_list.length; i++){ 
        if (connection_obj.use_port_obj.connection_list[i] == connection_obj) {
            connection_obj.use_port_obj.connection_list.splice(i, 1); 
            i--;
        }
        }
    for( var i = 0; i < connection_obj.provide_port_obj.connection_list.length; i++){ 
        if (connection_obj.provide_port_obj.connection_list[i] == connection_obj) {
            connection_obj.provide_port_obj.connection_list.splice(i, 1); 
            i--;
        }
    }
    connection_obj = undefined;
};


// function to remove connection konva group
function removeConnectionKonva(connection_obj){
    // destroy the connection group
    connection_obj.connection_group_konva.destroy();
};
