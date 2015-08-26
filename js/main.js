BUILD_STATE_BUTTON_CLASSES = {
  'Passed': 'btn-success',
  'Building': 'btn-warning',
  'Failed': 'btn-danger'
  }

function buildGroup(group) {
  $.each( group.pipelines, function(i , val) {

    btn_class = BUILD_STATE_BUTTON_CLASSES[val.instances[0].latest_stage_state];
    link = 'http://' + query.server + '/go/tab/pipeline/history/' + val.name;
    $( "#badges" ).append('<li class="col-xs-6"><a href="' + link + '" target="_blank" class="btn btn-lg ' + btn_class + '">' + val.name + '</button></li>')
  });
}

function queryParse(querystring) {
  var result = {};
  (querystring || '').replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) {
          result[$1] = $3 !== undefined ? decodeURIComponent($3) : $3;
      }
  );
  return result;
}

query = queryParse( window.location.search );
server = query.server ? query.server : config.server;
group = query.group ? _.trim(query.group, '/' ) : config.group ? config.group : null;

$.getJSON( server + "/go/dashboard.json", function( data ) {
  if ( group ) {
    buildGroup( _.find(data, { 'name': group } ));
  } else {
    $.each( data, function(i , val) {
      buildGroup(val);
    });
  };
});
