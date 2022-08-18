// Function to change stub name
function changeStubName(component, stub_name, new_stub_name) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_dependency_obj = found_component_obj.dependency_list.find(function(element) { return element.name == stub_name; });
    if (found_dependency_obj){ found_dependency_obj.name = new_stub_name; }
};
